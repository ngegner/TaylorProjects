#include "cachelab.h"
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <getopt.h>
#include <math.h>

//LANCE, NATHAN, and NOAH

/* Simple types for an address and for the value of the LRU counter */
typedef unsigned long mem_addr_t;
typedef unsigned long lru_t;

/* One cache line */
typedef struct {
  short valid;                                   /* Non-zero means line is valid */
  mem_addr_t tag;                               /* Tag bits from address */
  lru_t lru;                                    /* Least-recently-used value */
} cache_line_t;

/* One cache set: an array of E cache lines */
typedef cache_line_t* cache_set_t;

/* One cache: an array of S cache sets */
typedef cache_set_t* cache_t;

typedef struct {
	unsigned int block_bits;
	unsigned int set_bits;
	unsigned int tag;
} parsed_address_t;

char* trace_file_name;                  /* Name of the trace file */            /* Number of lines per set */
unsigned int E, e, s, b = 0;
int LRU_COUNTER = 0;

cache_t makeCache(int s, int E) {

    int S = (int)pow(2, s);
    cache_t cache = malloc(sizeof(cache_set_t*) * S);
    for (int i=0; i<S; i++) {
        cache[i] = malloc(sizeof(cache_line_t) * E);
    }

    for (int i=0; i<pow(2, s); i++) {
        for (int j=0; j<E; j++) {
            cache[i][j].tag = 0xFFFFFFFFF;
            cache[i][j].valid = 0;
            cache[i][j].lru = 0;
        }
    }

    return cache;
}

parsed_address_t parseAddress(unsigned long address, unsigned int E, unsigned int s, unsigned int b) {

	e = log2(E);

	parsed_address_t patty;
	patty.block_bits = address;
	patty.set_bits = address;
	patty.tag = address;
	patty.block_bits = (patty.block_bits << (64-b)) >> (64-b);
    patty.set_bits = (patty.set_bits << (64-(b+s))) >> (64-s);
    patty.tag = patty.tag >> (b+s);

	return patty;
}

void fill_empty(cache_line_t *value, parsed_address_t patty) {

    value->valid = 1;
    value->tag = patty.tag;
    ++LRU_COUNTER;
    value->lru = LRU_COUNTER;

}

int eviction(cache_t cache, parsed_address_t patty) {

    int l = 10000000;
    int index;
    cache_line_t *lru_line;
    // loop through all lines in set
    for (int i=0; i<E; i++) {
        cache_line_t cur_line = cache[patty.set_bits][i];
        if (cur_line.valid == 0) {
            fill_empty(&cur_line, patty);
            cache[patty.set_bits][i] = cur_line;
            return 3;
        } else if (cur_line.lru < l) {
            lru_line = &cur_line;
            l = cur_line.lru;
            index = i;
        }
    }
    // no empty spots, lru should be evicted
    ++LRU_COUNTER;
    lru_line->lru = LRU_COUNTER;
    lru_line->tag = patty.tag;
    lru_line->valid = 1;
    cache[patty.set_bits][index] = *lru_line;

    return 2;
}


int fulfill_load(cache_t cache, parsed_address_t patty, int E) {

    int occupied = 1;
    cache_line_t value;
    int empty;
    for (int i=0; i<E; i++) {
        value = cache[patty.set_bits][i];
        if ((value.tag == patty.tag) && (value.valid == 1)) {
            LRU_COUNTER++;
            cache[patty.set_bits][i].lru = LRU_COUNTER;
            return 1;
        }
        if (value.valid == 0) {
            occupied = 0;
            empty = i;
        }
    }

    if (occupied == 0) {
        fill_empty(&cache[patty.set_bits][empty], patty);
        return 0;
    } else return eviction(cache, patty);
}

int fulfill_store(cache_t cache, parsed_address_t patty, int E) {

    int occupied = 1;
    cache_line_t value;
    int empty;
    for (int i=0; i<E; i++) {
        value = cache[patty.set_bits][i];
        if (value.valid == 0) {
            occupied = 0;
            empty = i;
        } else if (value.tag == patty.tag) {
            ++LRU_COUNTER;
            cache[patty.set_bits][i].lru = LRU_COUNTER;
            cache[patty.set_bits][i].valid = 1;
            return 1;
        }
    }

    if (occupied == 0) {
        fill_empty(&cache[patty.set_bits][empty], patty);
        return 0;
    } else return eviction(cache, patty);
}


// 0 = miss, 1 = hit, 2 = miss eviction, 3 = miss hit, 4 = miss eviction hit, 5 = hit hit
int ping_cache(cache_t cache, parsed_address_t patty, char operation, int E) {

    int ret = -1;
    switch (operation) {
        case 'S':
            ret = fulfill_store(cache, patty, E);
            break;
        case 'L':
            ret = fulfill_load(cache, patty, E);
            break;
        case 'M':
            ret = fulfill_load(cache, patty, E);
            if (ret == 1) ret = 5;
            if (ret == 2) ret = 4;
            if (ret == 0) ret = 3;
            break;
        default:
            return -1;
    }

    return ret;
}

int main(int argc, char **argv){
    char c;

        /* A start on processing command-line arguments. See `man 3 getopt` for details. */
    while ((c = getopt(argc, argv, "s:E:b:t:h")) != -1) {
          switch(c) {
	  	case 's':
			s = atoi(optarg);
			break;
        	  case 'E':                                     /* Set number of lines per set. */
                E = atoi(optarg);
                break;
	 	 case 'b':
			b = atoi(optarg);
          	case 't':                                     /* Set name of file to read. */
                trace_file_name = optarg;
                break;
          	case 'h':
	  	default:
            fprintf(stderr, "usage: ...\n");
            exit(1);
          }
    }

        /* How to read from the trace file. */
        char operation;                         /* The operation (I, L, S, M) */
        mem_addr_t address;                     /* The address (in hex) */
        int size;                                       /* The size of the operation */

        cache_t cache = makeCache(s, E);

        FILE *tfp = fopen(trace_file_name, "r");
        int hits = 0, misses = 0, evictions = 0;
        while (fscanf(tfp, " %c %lx,%x\n", &operation, &address, &size) != EOF) {
            if (operation == 'I') continue;
            printf("%c %lx %x  ", operation, address, size);
            parsed_address_t patty = parseAddress(address, E, s, b);
            int result = ping_cache(cache, patty, operation, E);
            switch (result) {
                case 0:
                    printf("miss\n");
                    ++misses;
                    break;
                case 1:
                    printf("hit\n");
                    ++hits;
                    break;
                case 2:
                    printf("miss eviction\n");
                    ++misses;
                    ++evictions;
                    break;
                case 3:
                    printf("miss hit\n");
                    ++misses;
                    ++hits;
                    break;
                case 4:
                    printf("miss eviction hit\n");
                    ++misses;
                    ++hits;
                    ++evictions;
                    break;
                case 5:
                    printf("hit hit\n");
                    hits += 2;
                default:
                    continue;
            }
        }
        fclose(tfp);



        /* How to free the cache lines. Generalize! */
        free(cache);

	printSummary(hits,misses,evictions);
}



