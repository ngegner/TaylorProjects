//
// Created by Noah Gegner on 9/21/21.
//

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// -------------------------- Define Structs -------------------------- \\
// found byte values for header file from the wikipedia page: https://en.wikipedia.org/wiki/BMP_file_format

#pragma pack(push, 1)

typedef struct FILEHEADER_s {
    char bfType[2]; // should be "BM" -- 2 bytes
    unsigned int bfSize; // 4 bytes
    unsigned short unused1; // 2 bytes
    unsigned short unused2; // 2 bytes
    unsigned int imageOffset; // offset to the start of image data -- 4 bytes
} FILEHEADER_t;

#pragma pack(pop)

#pragma pack(push, 1)

typedef struct INFOHEADER_s {
    unsigned int header_size; // number of bytes required
    unsigned int width;
    unsigned int height;
    unsigned short planes;
    unsigned short bitPix;
    unsigned int bitCompression;
    unsigned int imageSize;
    unsigned int hRes;
    unsigned int vRes;
    unsigned int numOfColors;
    unsigned int importantColors;
} INFOHEADER_t;

#pragma pack(pop)

#pragma pack(push, 1)

typedef struct PIXEL_s {
    char rgba[4];
} PIXEL_t;

#pragma pack(pop)

#pragma pack(push, 1)

typedef struct IMAGE_s {
    int height;
    int width;
    PIXEL_t **rgba;
} IMAGE_t;

#pragma pack(pop)

// -------------------------- Helper Methods -------------------------- \\

void allocateMemory(int height, int width, IMAGE_t* p_image) {

    // this page was used as reference for memory allocation: https://www.geeksforgeeks.org/dynamically-allocate-2d-array-c/

    p_image->height = abs(height); // height/width could be negative
    p_image->width = abs(width);

    // create temporary pixel for memory allocation
    PIXEL_t** pp_pixel;
    pp_pixel = (PIXEL_t**) malloc(p_image->height * sizeof(PIXEL_t*));
    if (pp_pixel == NULL) printf("ROW ALLOCATION FAILED\n");
    for (int r=0; r<p_image->height; r++) {
        pp_pixel[r] = (PIXEL_t*) malloc(p_image->width * sizeof(PIXEL_t));
        if (pp_pixel[r] == NULL) printf("COL ALLOCATION FAILED\n");
    }

    // set image pixels to value of pp_pixel
    p_image->rgba = pp_pixel;

}

char* getBinary(char *str) {


    // allocate memory for binary string
    size_t stringLength = strlen(str);
    char *binary = malloc((stringLength * (sizeof(char) * 8)) + 1); // length of the string * bits + 1 for null
    if (binary == NULL) {
        printf("BINARY ALLOCATION FAILED");
        return NULL;
    }

    // null bit
    binary[0] = '\0';

    for(size_t i=0; i<stringLength; ++i) {
        char c = str[i];
        for(int j=0; j<8; ++j){
            if(c & (1 << j)) strcat(binary,"1");
            else strcat(binary,"0");
        }
    }

    return binary;

}

char convertPixel(char c, char secretBit) {

    if (secretBit == '1') {
        if (c % 2 == 0) return ++c;
    } else if (c % 2 == 1) {
        return --c;
    }
    return c;

}

char convertToNull(char c) { return c % 2 == 1 ? --c : c; }


// -------------------------- Begin Main -------------------------- \\

// found how to pass arguments from the command line here:
// https://stackoverflow.com/questions/16869467/command-line-arguments-reading-a-file/16869485
int main(int argc, char** argv) {

    FILE *fp;
    FILEHEADER_t header;
    INFOHEADER_t infoHeader;

    // open infile
    fp = fopen(argv[1], "rb"); // rb = read binary
    if (fp == NULL) {
        printf("Error reading in file\n");
        return 1;
    }

    // open outfile
    FILE *outf;
    outf = fopen(argv[2], "w+");
    if (outf == NULL) {
        printf("Error opening out file\n");
        return 1;
    }

    // read file header
    fread(&header, sizeof(FILEHEADER_t), 1, fp);
    printf("START OF PIXEL ARRAY: %d\n", header.imageOffset);

    // read info header
    fread(&infoHeader, sizeof(INFOHEADER_t), 1, fp);
    printf("IMAGE WIDTH: %d\n"
           "IMAGE HEIGHT: %d\n", infoHeader.width, infoHeader.height);

    // set position to start of pixels
    fseek(fp, header.imageOffset, SEEK_SET);

    IMAGE_t image;
    allocateMemory(infoHeader.height, infoHeader.width, &image);

    char *secret = argv[3];
    char *binSecret = getBinary(secret);

    fseek(fp, 0, SEEK_SET);
    fseek(outf, 0, SEEK_SET);
    char test;
    for (int i=0; i<header.imageOffset; i++) {
        fread(&test, 1, 1, fp);
        // printf("%d\n", test);
        fwrite(&test, 1, 1, outf);
    }

    fseek(fp, header.imageOffset, SEEK_SET);
    fseek(outf, header.imageOffset, SEEK_SET);


    int count = (int) strlen(binSecret); // decreasing count of the number of bits left to read from secret message
    int si = 0; // secret index -- the index of the secret message bit we are currently encoding

    for (int i=0; i<image.height; i++) {
        for (int j=0; j<image.width; j++) {
            image.rgba[i][j].rgba[0] = (char) getc(fp); // put the blue value of the pixel
            if (count > 0) {
                image.rgba[i][j].rgba[0] = convertPixel(image.rgba[i][j].rgba[0], binSecret[si]); // change LSB if necessary
                // increment iterators
                si++;
                count--;
            } else if (count > -8) { // null byte
                image.rgba[i][j].rgba[0] = convertToNull(image.rgba[i][j].rgba[0]);
                // change count but no need to change secret index anymore
                count--;
            }
            // write byte to out image
            fwrite(&image.rgba[i][j].rgba[0], 1, 1, outf);

            image.rgba[i][j].rgba[1] = (char) getc(fp); // green value
            if (count > 0) {
                image.rgba[i][j].rgba[1] = convertPixel(image.rgba[i][j].rgba[1], binSecret[si]); // change LSB if necessary
                // increment iterators
                si++;
                count--;
            } else if (count > -8) { // null byte
                image.rgba[i][j].rgba[1] = convertToNull(image.rgba[i][j].rgba[1]);
                // change count but no need to change secret index anymore
                count--;
            }
            // write byte to out image
            fwrite(&image.rgba[i][j].rgba[1], 1, 1, outf);

            image.rgba[i][j].rgba[2] = (char) getc(fp); // red value
            if (count > 0 ) {
                image.rgba[i][j].rgba[2] = convertPixel(image.rgba[i][j].rgba[2], binSecret[si]); // change LSB if necessary
                // increment iterators
                si++;
                count--;
            } else if (count > -8) { // null byte
                image.rgba[i][j].rgba[2] = convertToNull(image.rgba[i][j].rgba[2]);
                // change count but no need to change secret index anymore
                count--;
            }
            // write byte to out image
            fwrite(&image.rgba[i][j].rgba[2], 1, 1, outf);

            // alpha value -- change nothing, just write to out file
            image.rgba[i][j].rgba[3] = (char) getc(fp);
            fwrite(&image.rgba[i][j].rgba[3], 1, 1, outf);
        }
    }

    // close images
    fclose(fp);
    fclose(outf);
    return 0;

}
