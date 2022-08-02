#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <fstream>

#define MAXBUFLEN 1468

using std::ifstream;
using std::ofstream;
using std::ios;
using std::cout;
using std::endl;
using std::copy;

char *SERVER_IP;
char *PORT;
char *REMOTE_PATH;
char *LOCAL_PATH;
const struct addrinfo *p;

void test_store_data() {

    ifstream stream;
    stream.open(LOCAL_PATH, ios::out);
    stream.seekg(0, std::ifstream::end);
    long length = stream.tellg();
    stream.seekg(0, std::ifstream::beg);
    char *test = new char[length];
    stream.read(test, 10);

    if (!stream) cout << "ERROR" << endl;
    else cout << test << endl;

    delete[] test;
}

void store_data(char buf[], ofstream *stream) {

    // must get rid of sequence number bit
    size_t buf_len = strlen(buf);
    char store_buf[buf_len-1];
    copy(buf+1, buf+buf_len, store_buf);
    stream->write(store_buf, (long)buf_len-1);

}

ssize_t send_packet(int sockfd, char *message) {

    ssize_t numbytes;
    if ((numbytes = sendto(sockfd, message, strlen(message), 0, p->ai_addr, p->ai_addrlen)) == -1)
        return -1;

    return numbytes;
}

int process_request(int sockfd) {

    // send initial request
    if (send_packet(sockfd, REMOTE_PATH) == -1) {
        perror("send failed");
    }

    ofstream stream;
    stream.open(LOCAL_PATH, ios::out);
    if (!stream) {
        perror("bad file\n");
        exit(1);
    }

    char *ACK0 = (char *)"0";
    char *ACK1 = (char *)"1";
    socklen_t addrlen = p->ai_addrlen;
    char current_seq_num = '0';
    while (true) { // change when ending of loop decided
        char buf[MAXBUFLEN];
        ssize_t numbytes;

        if ((numbytes = recvfrom(sockfd, buf, MAXBUFLEN-1, 0, p->ai_addr,
                                 &addrlen)) == -1)
            continue; // wait for a correct packet

        if (buf[0] != current_seq_num) continue; // wait for server to timeout and send correct packet
        store_data(buf, &stream);

        if (current_seq_num == '0') {
            send_packet(sockfd, ACK0);
            current_seq_num = '1';
        } else {
            send_packet(sockfd, ACK1);
            current_seq_num = '0';
        }
        if (numbytes < MAXBUFLEN) break; // last segment of file
    }

    stream.close();
    return 0;
}

int main(int argc, char *argv[]) {

    if (argc != 5) {
        fprintf(stderr,"usage: talker hostname message\n");
        exit(1);
    }
    SERVER_IP = argv[1];
    PORT = argv[2];
    REMOTE_PATH = argv[3];
    LOCAL_PATH = argv[4];

    int sockfd;
    struct addrinfo hints, *servinfo;
    int rv;
    int numbytes;

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_INET6; // set to AF_INET to use IPv4
    hints.ai_socktype = SOCK_DGRAM;

    if ((rv = getaddrinfo(SERVER_IP, PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // loop through all the results and make a socket
    for(p = servinfo; p != nullptr ; p = p->ai_next) {
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                             p->ai_protocol)) == -1) {
            perror("talker: socket");
            continue;
        }

        break;
    }

    if (p == nullptr) {
        fprintf(stderr, "talker: failed to create socket\n");
        return 2;
    }

    process_request(sockfd);

    freeaddrinfo(servinfo);
    close(sockfd);
    return 0;
}