#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include "all.h"

int score(const char* buf, int length)
{
	return score_freq(buf, length) + trigram_score_buf(buf, length);
}

int main()
{
	trigram_init();
	words_init();
	MTRand rnd = seedRand(0x8fe2d2c0);

	{ // verification
		void* vf = malloc(algo_size());
		algo_initial_guess(vf, 1, &rnd);
		algo_score(vf, 1);
	}

	hillclimb();

	return 0;
}
