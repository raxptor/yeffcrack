#include "mtwister.h"

typedef struct algo_run_data_t {
	void* crack;
	char* tmp0;
	char* tmp1;
	char* output;
	int length;
} algo_run_data;


typedef struct algo_reset_data_t {
	char* polybius;
	char* coltrans;
} algo_reset_data;

typedef int(*t_score_fn)(const char* buf, int length);
typedef void(*t_analyze_fn)(const char* buf);
int user_chosen_scoring(const char* buf, int length);

int algo_size();
void algo_initial_guess(void* ptr, int as_given, MTRand* rand);
void algo_random_walk(void* ptr, long mask, MTRand* rand);
int algo_score(void* ptr, t_score_fn fn, int print);
void algo_run(algo_run_data* run, int print);
void algo_reset(void* ptr, algo_reset_data* rd);
int algo_is_fractionated();

void trigram_init();
int trigram_score_buf(const char *t, int length);
void quadgram_init();
int quadgram_score_buf(const char *t, int length);
int score_freq(const char* buf, int length);
int score_freq_with_sorting_positive(const char* buf, int length);

void words_init();
const char* word_get_random(int length, MTRand* rand);

// cracks
void permutation_walk(char* p, MTRand* rand, int len);
void permutation_reset(char* p, int len, char base);
const char* word_get_random(int length, MTRand* rand);

void source_polybius(char *buf, MTRand *rand);
void source_coltransp(char *buf, int len, MTRand *rand);

void permutation_walk(char* perm, MTRand* rand, int len);

int compute_ic(const char* buf, int len);
#define ENGLISH_IC 6860

void hillclimb();

void bulk_analyze_freq(const char *buf);
void bulk_analyze_subst(const char *buf);

#define RNDWALK_POLYBIUS            1
#define RNDWALK_TRANSPOSITION       2
