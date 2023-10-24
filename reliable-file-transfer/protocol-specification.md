# Noah Gegner - COS 331 project
# Specification
This is a stop-and-wait reliable file transfer protocol. When a file is requested, the server sends one packet of data, and then waits for a response from the client. Once an acknowledgement received, the server sends the next packet, and so on. The server cannot send the next packet of data until it receives a response from the previous packet.
## Server
### Packets Containing Errors or Incorrect Sequence Numbers
Upon reception of a packet the server checks if it has the correct sequence number bit value. If not, sender waits without updating its sequence number until a correct ACK is received or the sent packet times-out.
### Timeout
To account for dropped packets, the server starts a timer when a packet is sent. If the timer ends before a correct response is received, the server resends the packet and restarts the timer.
### Duplicate ACKs
Duplicate ACKs are not a problem. The server simply recognizes that the last packet was receives, and updates its sequence number accordingly.
### Receiving Correct ACKs
Upon receiving an uncorrupted ACK with the correct sequence number, the server updates its sequence number and (if availible) encapsulates the next chunk of data in a packet, which is then sent with a new checksum and the current sequence number. It then waits for the next ACK from the client.
## Client
### Packets Containing Errors or Incorrect Sequence Numbers
Upon reception of a packet, the client checks if it has the correct sequence number bit value. If not, the client sends an ACK packet with a sequence number equivalent to that of the last correctly received packet.
### Receiving Duplicate Packets
If a duplicate packet is received (likely due to timeout or loss of an ACK packet), the client simply retransmits an ACK packet corresponding to that sequence number and waits for the next packet in the sequence.
### Receiving Correct Packets
When a packet is received with the correct sequence number and without any errors, the client extracts the data from the packet and passes it to the upper-layer application. It then sends a corresponding ACK packet to the server and waits for the next packet in the sequence.
## Packets
Sent packets include three key parts: a sequence number, content-length, and the data to be sent. Because this is a stop-and-wait protocol, the sequence number needs only to be a 1 bit number that alternates between 1 and 0 after an ACK is received with the same sequence bit value.
The checksum is included ensure data integrity is maintained. Upon reception of a packet, both the client and the server must use the checksum to validate that all bits in the packet have been received without error.
Finally, the packet contains the data to be sent. In the case of the server, this is a segment of the file that should be extracted and passed to the upper-layer application that requested the file. For client-sent packets, this field simply specifies that this is an ACK packet corresponding to the specified sequence number.
## Example Packet Sequences
Figure 1 displays the packet sequence assuming no loss occurs on either side:

![Figure 1](https://repo.cse.taylor.edu/group-work/ldetloff-ngegner/-/blob/master/images/IMG_1964.png)

Figure 2 shows the packet sequence  taken in an instance of packet loss on the server side.

![Figure 2](https://repo.cse.taylor.edu/group-work/ldetloff-ngegner/-/blob/master/images/IMG_1965.png)

Figure 3 shows the path taken when an ACK packet is lost.\n

![Figure 3](https://repo.cse.taylor.edu/group-work/ldetloff-ngegner/-/blob/master/images/IMG_1966.png)

Figure 4 displays the sequence taken when a duplicate packet is sent.\n

![Figure 4](https://repo.cse.taylor.edu/group-work/ldetloff-ngegner/-/blob/master/images/IMG_1967.png)


