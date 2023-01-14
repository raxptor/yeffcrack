#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include "mtwister.h"

int algo_size();
void algo_initial_guess(void* ptr, int as_given, MTRand* rand);
void algo_random_walk(void* ptr, MTRand* rand);
int algo_score(void* ptr, int print);
void trigram_init();
int trigram_score_buf(const char *t, int length);

int best_ever = 0;
int score(const char* buf, int length)
{
	int score = trigram_score_buf(buf, length);
	if (score > best_ever)
	{
		char buf2[4096];
		memcpy(buf2, buf, length);
		buf2[length] = 0;
		printf("%s scores %d\n", buf2, score);
		best_ever = score;
	}
	return score;
}

int main()
{
	trigram_init();
	MTRand rnd = seedRand(0x8fe2d2c0);

	{ // verification
		void* vf = malloc(algo_size());
		algo_initial_guess(vf, 1, &rnd);
		algo_score(vf, 1);
		return 0;
	}

		
	const int total = 20;
	void* cracks[1024];
	int best[1024];
	int stalled[1024];
	for (int i = 0; i < total; i++)
	{
		cracks[i] = malloc(algo_size());
		algo_initial_guess(cracks[i], 0, &rnd);
		best[i] = algo_score(cracks[i], 0);
	}

	char* tmp = malloc(algo_size());
	int looper = 0;
	while (1)
	{
		if (looper == total) looper = 0;

		memcpy(tmp, cracks[looper], algo_size());
		algo_random_walk(tmp, &rnd);
		int new_score = algo_score(tmp, 0);
		if (new_score > best[looper]) {
			memcpy(cracks[looper], tmp, algo_size());
			//printf("(%d) improved %d => %d\n", looper, best[looper], new_score);
			best[looper] = new_score;
			stalled[looper] = 0;
		} else {
			stalled[looper]++;
			if (stalled[looper] > 1000) {
				//printf("reset on %d", looper);
				algo_initial_guess(cracks[looper], 0, &rnd);
				best[looper] = algo_score(cracks[looper], 0);
				stalled[looper] = 0;
			}
		}

		++looper;
	}


	/*
	void* buf = ;
	for (int i = 0; i < 25; i++) {
		algo_random_walk(buf, &rnd);
		algo_score(buf);
	}
	*/	
	return 0;
}
