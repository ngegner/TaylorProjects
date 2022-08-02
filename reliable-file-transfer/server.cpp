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
#include <poll.h>

#define MAXBUFLEN 1468
#define CLOCK_DELAY 1000

using std::ifstream;
using std::ofstream;
using std::ios;
using std::copy;
using std::cout;
using std::endl;

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa) {
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int process_request(int sockfd, addrinfo *p) {

    ssize_t numbytes;
    long file_length;
    char buf[MAXBUFLEN];
    ifstream stream;
    while (true) { // infinite loop to get first request package
        if ((numbytes = recvfrom(sockfd, buf, MAXBUFLEN-1 , 0,
                                 (struct sockaddr *)p->ai_addr, &p->ai_addrlen)) == -1) {
            perror("recvfrom");
        } else {
            // extract file path from weird thing
            char file_path[numbytes];
            copy(buf, buf+numbytes, file_path);
            stream.open(file_path, ios::in);
            if (!stream) {
                char *bad_file = (char *)"File cannot be accessed";
                if ((numbytes = sendto(sockfd, bad_file, strlen(bad_file), 0, p->ai_addr, p->ai_addrlen)) == -1)
                    return -1;
                exit(1);
            }

            stream.seekg(0, std::ifstream::end);
            file_length = stream.tellg();
            stream.seekg(0, std::ifstream::beg);
            break;
        }
    }

    // second loop for actual exchange
    char current_seq_num = '0';
    int i, numevents, pollin;
    struct pollfd pfd[1];
    pfd[0].fd = sockfd;
    pfd[0].events = POLLIN;

    while (file_length != 0) {

        size_t packet_len = ((file_length - MAXBUFLEN) > 0) ? MAXBUFLEN : file_length;
        char packet[packet_len];
        packet[0] = current_seq_num;
        for (i=1; i<=strlen(packet); i++) {
            stream >> packet[i];
        }
        if ((numbytes = sendto(sockfd, packet, packet_len, 0, (struct sockaddr *)p->ai_addr, p->ai_addrlen)) == -1) {
            cout << "send failed" << endl;
            continue;
        }

        /** TODO: correct timer method */
        numevents = poll(pfd, 1, CLOCK_DELAY);
        if (numevents == 0) continue; // timeout
        else {
            pollin = pfd[0].revents & POLLIN;
            if (pollin) {
                if ((numbytes = recvfrom(sockfd, buf, MAXBUFLEN - 1, 0,
                                         (struct sockaddr *) p->ai_addr, &p->ai_addrlen)) == -1)
                    continue;
                else if (buf[0] != current_seq_num) continue;
                else {
                    file_length -= numbytes;
                    current_seq_num = current_seq_num == '0' ? '1' : '0';
                }
            } else continue;
        }
    }

    return 0;
}

int main(int argc, char *argv[]) {

    // parse CLI args
    if (argc != 2) {
        cout << "invalid arguments" << endl;
        exit(1);
    }
    char *PORT = argv[1];

    int sockfd;
    struct addrinfo hints, *servinfo, *p;
    int rv;
    int numbytes;
    struct sockaddr_storage their_addr;
    char buf[MAXBUFLEN];
    socklen_t addr_len;
    char s[INET6_ADDRSTRLEN];

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_INET6; // set to AF_INET to use IPv4
    hints.ai_socktype = SOCK_DGRAM;
    hints.ai_flags = AI_PASSIVE; // use my IP

    if ((rv = getaddrinfo(nullptr, PORT
            , &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // loop through all the results and bind to the first we can
    for(p = servinfo; p != nullptr; p = p->ai_next) {
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                             p->ai_protocol)) == -1) {
            perror("listener: socket");
            continue;
        }

        if (::bind(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            close(sockfd);
            perror("listener: bind");
            continue;
        }

        break;
    }

    if (p == nullptr) {
        fprintf(stderr, "listener: failed to bind socket\n");
        return 2;
    }

    freeaddrinfo(servinfo);
    cout << "listener: waiting to recvfrom..." << endl;

    process_request(sockfd, p);

    /*
    printf("listener: got packet from %s\n",
           inet_ntop(their_addr.ss_family,
                     get_in_addr((struct sockaddr *)&their_addr),
                     s, sizeof s));
    printf("listener: packet is %d bytes long\n", numbytes);
    buf[numbytes] = '\0';
    printf("listener: packet contains \"%s\"\n", buf);
     */

    close(sockfd);
    return 0;
}