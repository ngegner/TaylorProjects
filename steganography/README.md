# Summary
`Encoder.c` is a steganography encoder built in C that conceals a secret message in a BMP file. The program accepts three arguments: the path to an input file (such as sheldon.bmp), the path to an output file, and a text string containing a secret message. The program writes to STDOUT the starting position of the pixel array and the width and height of the image, and it outputs a copy of the input image with the secret message encoded in it.

The encode the message in the file, the program repurposes the least significant bit (LSB) of each color byte of each pixel. So, the LSB of the first color byte of the first pixel encodes the LSB of the first byte of the message, the LSB of second color byte of the first pixel encodes the next bit of the first byte of the message, and so on.

# Running Encoder
Encoder accept three command line arguments:

1. INPUT FILE PATH: path to an input file. The input file has the following characteristics:
	- Uncompressed BMP file
	- 32 bit pixel size
1. OUTPUT FILE PATH: path to an output file
	- File may or may not exist, if it does exist it will be overwritten
1. SECRET MESSAGE: text string containing secret message
