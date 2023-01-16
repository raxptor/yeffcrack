#include "mtwister.h"

int algo_size();
void algo_initial_guess(void* ptr, int as_given, MTRand* rand);
void algo_random_walk(void* ptr, long mask, MTRand* rand);
int algo_score(void* ptr, int print);

void trigram_init();
int trigram_score_buf(const char *t, int length);
int score_freq(const char* buf, int length);

void words_init();
const char* word_get_random(int length, MTRand* rand);

// cracks
void permutation_walk(char* p, MTRand* rand, int len);
const char* word_get_random(int length, MTRand* rand);
int score(const char* buf, int length);

void source_polybius(char *buf, MTRand *rand);
void source_transposition(char *buf, int len, MTRand *rand);

void hillclimb();

#define RNDWALK_POLYBIUS            1
#define RNDWALK_TRANSPOSITION       2
