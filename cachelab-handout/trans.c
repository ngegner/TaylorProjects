/*
 * Noah, Nathan, Lance
 *
 * trans.c - Matrix transpose B = A^T
 *
 * Each transpose function must have a prototype of the form:
 * void trans(int M, int N, int A[N][M], int B[M][N]);
 *
 * A transpose function is evaluated by counting the number of misses
 * on a 1KB direct mapped cache with a block size of 32 bytes.
 */
#include <stdio.h>
#include "cachelab.h"


int is_transpose(int M, int N, int A[N][M], int B[M][N]);

/* 
 * transpose_submit - This is the solution transpose function that you
 *     will be graded on for Part B of the assignment. Do not change
 *     the description string "Transpose submission", as the driver
 *     searches for that string to identify the transpose function to
 *     be graded. 
 */
void transpose_32(int M, int N, int A[N][M], int B[M][N]) {
    int a_col, a_row, row, col, diag_value, diag_row, diag_col;
    int is_diag = 0;

    for (a_row = 0; a_row < N; a_row += 8) {
        for (a_col = 0; a_col < M; a_col += 8) {
            for (row = a_row; row < (8 + a_row); row++) {
                for (col = a_col; col < (8 + a_col); col++) {
                    if (row == col) { // on a diagonal => save index, set counter to wait until rest of block is transposed
                        diag_row = row;
                        diag_col = col;
                        diag_value = A[row][col];
                        is_diag = 1;
                    } else {
                        B[col][row] = A[row][col];
                    }
                }
                if (is_diag == 1) { // all other data from block filled => can now fill collision spot and eviction won't matter
                    B[diag_row][diag_col] = diag_value;
                    is_diag = 0;
                }
            }
        }
    }
}

void transpose_64(int M, int N, int A[N][M], int B[M][N]) {
    int val0, val1, val2, val3, val4, val5, val6, val7;
    for (int a = 0; a < N; a += 8) {
        for (int b = 0; b < M; b += 8) {
            for (int x = a; x<a+4; x++){
                //LOOP FOR STEP 1
                //gets values for W^T
                val0 = A[x][b];
                val1 = A[x][b+1];
                val2 = A[x][b+2];
                val3 = A[x][b+3];
                //gets values for X^T
                val4 = A[x][b+4];
                val5 = A[x][b+5];
                val6 = A[x][b+6];
                val7 = A[x][b+7];
                //puts values from W^T to Z'
                B[b+4][x+4] = val3;
                B[b+5][x+4] = val2;
                B[b+6][x+4] = val1;
                B[b+7][x+4] = val0;
                //puts values from X^T into X'
                B[b+7][x] = val7;
                B[b+6][x] = val6;
                B[b+5][x] = val5;
                B[b+4][x] = val4;
            }
            for (int y = 0; y<4; y++){
                //stores values from Z to go into Z`...step 2
                val0 = A[a+4][b+7-y];
                val1 = A[a+5][b+7-y];
                val2 = A[a+6][b+7-y];
                val3 = A[a+7][b+7-y];
                //stores values from Y in temp to go to Y`
                val4 = A[a+4][b+y];
                val5 = A[a+5][b+y];
                val6 = A[a+6][b+y];
                val7 = A[a+7][b+y];
                //writes values from Z' to move them to W'
                B[b+y][a] = B[b+7-y][a+4];
                B[b+y][a+1] = B[b+7-y][a+5];
                B[b+y][a+2] = B[b+7-y][a+6];
                B[b+y][a+3] = B[b+7-y][a+7];
                //writes values from temp to Z`
                B[b+7-y][a+4] = val0;
                B[b+7-y][a+5] = val1;
                B[b+7-y][a+6] = val2;
                B[b+7-y][a+7] = val3;
                //writes values from temp to go into Y'
                B[b+y][a+4] = val4;
                B[b+y][a+5] = val5;
                B[b+y][a+6] = val6;
                B[b+y][a+7] = val7;
            }
        }
    }
}
void transpose_irreg(int M, int N, int A[N][M], int B[M][N]) {
    int a_col, a_row, row, col, diag_value, diag_row, diag_col;
    int is_diag = 0;
    for (a_row = 0; a_row < N; a_row += 16) {
        for (a_col = 0; a_col < M; a_col += 16) {
            for (row = a_row; row < (16 + a_row) && row<N; row++) {
                for (col = a_col; col < (16 + a_col) && col<M; col++) {
                    if (row == col) { // on a diagonal => save index, set counter to wait until rest of block is transposed
                        diag_row = row;
                        diag_col = col;
                        diag_value = A[row][col];
                        is_diag = 1;
                    } else {
                        B[col][row] = A[row][col];
                    }
                }
                if (is_diag == 1) { // all other data from block filled => can now fill collision spot and eviction won't matter
                    B[diag_row][diag_col] = diag_value;
                    is_diag = 0;
                }
            }
        }
    }
}
char transpose_submit_desc[] = "Transpose submission";
void transpose_submit(int M, int N, int A[N][M], int B[M][N]) {
    switch(N) {
        case 32:
            transpose_32(M, N, A, B);
            break;
        case 64:
            transpose_64(M, N, A, B);
            break;
        default:
            transpose_irreg(M,N,A,B);
    }
}
char trans_desc[] = "Simple row-wise scan transpose";

void trans(int M, int N, int A[N][M], int B[M][N]) {
    int i, j, tmp;

    for (i = 0; i < N; i++) {
        for (j = 0; j < M; j++) {
            tmp = A[i][j];
            B[j][i] = tmp;
        }
    }

}

/*
 * registerFunctions - This function registers your transpose
 *     functions with the driver.  At runtime, the driver will
 *     evaluate each of the registered functions and summarize their
 *     performance. This is a handy way to experiment with different
 *     transpose strategies.
 */
void registerFunctions() {
    /* Register your solution function */
    registerTransFunction(transpose_submit, transpose_submit_desc);
}

/* 
 * is_transpose - This helper function checks if B is the transpose of
 *     A. You can check the correctness of your transpose by calling
 *     it before returning from the transpose function.
 */
int is_transpose(int M, int N, int A[N][M], int B[M][N]) {
    int i, j;

    for (i = 0; i < N; i++) {
        for (j = 0; j < M; ++j) {
            if (A[i][j] != B[j][i]) {
                return 0;
            }
        }
    }
    return 1;
}

