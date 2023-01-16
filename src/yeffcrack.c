#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include "all.h"

int scoring = 0;

int algo_score(void* ptr, t_score_fn fn, int print) {
	char tmp0[1024];
	char tmp1[1024];
	algo_run_data run;
	run.crack = ptr;
	run.tmp0 = tmp0;
	run.tmp1 = tmp1;
	algo_run(&run, print);
	return fn(run.output, run.length);
}

int user_chosen_scoring(const char* buf, int length)
{
	int diff;
	switch (scoring) {
		case 0: 
			return trigram_score_buf(buf, length) + score_freq(buf, length);
		case 1:
			diff = (compute_ic(buf, length) - ENGLISH_IC);
			return 1000000000 - diff * diff;
		default:
			printf("Invalid scoring!");
			exit(-1);
			break;
	}
}

int no_score(const char* buf, int length)
{
	return 0;
}

int main(int argc, char *argv[])
{
	trigram_init();
	words_init();
	MTRand rnd = seedRand(0x8fe2d2c0);

	printf("Is fractionated: %d\n", algo_is_fractionated());
	{ // verification
		void* vf = malloc(algo_size());
		algo_initial_guess(vf, 1, &rnd);
		algo_score(vf, &no_score, 1);
	}
	/*
	for (int i = 0; i < argc; i++) {
		if (i < (argc - 1)) {
			if (!strcmp(argv[i], "--scoring")) {
				if (!strcmp(argv[i + 1], "ic")) {
					scoring = 1;
				} else {
					fprintf(stderr, "Invalid scoring mode.\n");
					exit(1);
				}
			}
		}
	}*/

	printf("Scoring mode is %d\n", scoring);
	hillclimb();

	return 0;
}
