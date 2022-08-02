// Original code from https://gist.github.com/chrisnc/b0c072ed8e9fb8cac96c

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

#include <stdint.h> // for fixed size types (e.g., uint8_t)
#include <string.h> // for memset()
#include <unistd.h> // for close()

// for Networking data structres
#include <arpa/inet.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <netinet/udp.h>
#include <sys/socket.h>

using namespace std;

const uint16_t UDP_SRC = 10000;
const uint16_t UDP_DST = 15000;

uint16_t checksum(const vector<uint8_t>& buf) {
  uint32_t sum = 0;

  for (size_t i = 0; i+1 < buf.size(); i += 2) {
    sum += buf[i] << 8 | buf[i + 1];
  }
  if (buf.size() % 2 == 1) {
    sum += buf[buf.size() - 1] << 8;
  }
  while (sum > 0xffff) {
    sum = (sum >> 16) + (sum & 0xffff);
  }
  sum = htons(~sum);
  /*
   * From RFC 768:
   * If the computed checksum is zero, it is transmitted as all ones (the
   * equivalent in one's complement arithmetic). An all zero transmitted
   * checksum value means that the transmitter generated no checksum (for
   * debugging or for higher level protocols that don't care).
   */
  return sum ? sum : 0xffff;
}

// IP pseudo header used for checksum calculation
struct PseudoIPHeader {
  in_addr ip_src;
  in_addr ip_dst;
  uint8_t zero;
  uint8_t ip_p;
  uint16_t len;
  PseudoIPHeader(const in_addr& src, const in_addr& dst,
                 uint8_t proto, uint16_t len);
} __attribute__((packed));

PseudoIPHeader::PseudoIPHeader(const in_addr& src, const in_addr& dst,
                               uint8_t proto, uint16_t len)
{
  this->ip_src = src;
  this->ip_dst = dst;
  this->zero = 0;
  this->ip_p = proto;
  this->len = len;
}

// Calculate the UDP checksum given the start of the IP header.
uint16_t udp_checksum(const vector<uint8_t>& packet) {
  const ip* ihdr = (ip*)packet.data();
  const udphdr* uhdr = (udphdr*)(packet.data() + sizeof(ip));

  vector<uint8_t> cksum_buf(sizeof(PseudoIPHeader) + ntohs(uhdr->len));
  new(cksum_buf.data()) PseudoIPHeader(ihdr->ip_src, ihdr->ip_dst,
                                       ihdr->ip_p, uhdr->len);

  auto uhdr_iter = packet.begin() + sizeof(ip);
  copy(uhdr_iter, uhdr_iter + ntohs(uhdr->len),
       cksum_buf.data() + sizeof(PseudoIPHeader));

  return checksum(cksum_buf);
}

struct IPHeader : public ip {
  IPHeader(const in_addr_t& src_ip,
           const in_addr_t& dst_ip,
           uint8_t proto,
           uint16_t len);
};

IPHeader::IPHeader(const in_addr_t& src_ip,
                   const in_addr_t& dst_ip,
                   uint8_t proto,
                   uint16_t len)
{
  this->ip_hl = 5;
  this->ip_v = 4;
  this->ip_tos = 0;
  this->ip_id = 0;
  this->ip_ttl = 64;
  this->ip_p = proto;
  this->ip_src.s_addr = src_ip;
  this->ip_dst.s_addr = dst_ip;
  this->ip_len = htons(len);

  this->ip_sum = 0; // automatically computed for us as
  //this->ip_sum = checksum(bytes);
}

struct UDPHeader : public udphdr {
  UDPHeader(uint16_t src_port, uint16_t dst_port, uint16_t payload_size);
};

UDPHeader::UDPHeader(uint16_t src_port, uint16_t dst_port, uint16_t payload_size) {
  this->uh_sport = htons(src_port);
  this->uh_dport = htons(dst_port);
  this->uh_ulen = htons(sizeof(udphdr) + payload_size);
}

struct Packet {
  vector<uint8_t> bytes;
  Packet(const in_addr_t& src_ip,
         uint16_t src_port,
         const in_addr_t& dst_ip,
         uint16_t dst_port,
         const string& payload);
};

Packet::Packet(const in_addr_t& src_ip,
               uint16_t src_port,
               const in_addr_t& dst_ip,
               uint16_t dst_port,
               const string& payload)
  : bytes(payload.size() + sizeof(ip) + sizeof(udphdr))
{
  new(bytes.data()) IPHeader(src_ip, dst_ip, IPPROTO_UDP, bytes.size());

  uint8_t* uhdr_ptr = bytes.data() + sizeof(ip);
  auto* uhdr = new(uhdr_ptr) UDPHeader(src_port, dst_port, payload.size());

  uint8_t* data = uhdr_ptr + sizeof(udphdr);
  copy(begin(payload), end(payload), data);

  uhdr->uh_sum = udp_checksum(bytes);
}

int main(int argc, char** argv) {
  const in_addr_t localhost = inet_addr("127.0.0.1");
  const in_addr_t src_ip = argc > 1 ? inet_addr(argv[1]) : localhost;
  const in_addr_t dst_ip = argc > 2 ? inet_addr(argv[2]) : localhost;

  int fd = socket(PF_INET, SOCK_RAW, IPPROTO_RAW);
  if (fd < 0) {
    cerr << "Couldn't create a raw socket.\n";
    return 1;
  }

  const int one = 1;
  if (setsockopt(fd, IPPROTO_IP, IP_HDRINCL, &one, sizeof(one)) < 0) {
    cerr << "Couldn't enable IP_HDRINCL\n";
    close(fd);
    return 1;
  }

  sockaddr_in addr;
  addr.sin_family = AF_INET;
  addr.sin_port = htons(UDP_DST);
  addr.sin_addr.s_addr = dst_ip;
  memset(addr.sin_zero, 0, sizeof(addr.sin_zero));

  for (string line; getline(cin, line);) {
    line.push_back('\n');
    Packet packet(src_ip, UDP_SRC, dst_ip, UDP_DST, line);

    ssize_t bytes_sent = sendto(fd, packet.bytes.data(), packet.bytes.size(),
                                0, (sockaddr*)&addr, sizeof(addr));
    if (bytes_sent == -1) {
      cerr << "There was an error sending the packet.\n";
    } else {
      cout << bytes_sent << " bytes were sent.\n";
    }
  }

  close(fd);
  return 0;
}
