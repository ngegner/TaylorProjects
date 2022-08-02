cmake_minimum_required(VERSION 3.20)
project(reliable-file-transfer)

set(CMAKE_CXX_STANDARD 14)

add_executable(reliable-file-transfer
        server.cpp)
