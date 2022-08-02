# Summary
This project contains both client and server programs for a reliable file transfer protocol which I designed (see [protocol-specification](https://github.com/ngegner/TaylorProjects/blob/main/reliable-file-transfer/protocol-specification.md)).
# Running the Project
## Client
client.cpp takes 4 arguments:
    1. SERVER_IP: ip address of the RFT server
    1. SERVER_PORT: network port number where server is listening
    1. REMOTE_PATH: filesystem path on the server for the file to be downloaded
    1. LOCAL_PATH: filesystem path on the client machine where to store the downloaded file
## Server
server.cpp takes 1 arugment:
  1. LISTENING_PORT: network port number where server is listening
