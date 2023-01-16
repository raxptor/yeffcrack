#include <memory.h>
#include <stdlib.h>
#include <stdio.h>

#include "all.h"

static char buf[4096];

typedef struct SortEntry_t {
	long score;
	int index;
} SortEntry;

int cmp_score(const void *va, const void *vb)
{
	long a = ((SortEntry *)va)->score, b = ((SortEntry *)vb)->score;
	return a < b ? 1 : a > b ? -1 : 0;
}

int new_crack(void *p, MTRand* rand)
{
	int best = -1;
	for (int i = 0; i < 100; i++)
	{
		algo_initial_guess(buf, 1, rand);
		int score = algo_score(buf, 0);
		if (score >= best) {
			best = score;
			memcpy(p, buf, algo_size());
		}
	}
	return best;
}

void hillclimb()
{
	MTRand rnd = seedRand(0x8fe2d2c0);
	const int total = 500;
	const int size = algo_size();
	void* crack_cur[1024];
	void* crack_best[1024];

	int best[1024];

	for (int i = 0; i < total; i++)
	{
		crack_cur[i] = malloc(size);
		crack_best[i] = malloc(size);
		new_crack(crack_cur[i], &rnd);
		memcpy(crack_best[i], crack_cur[i], size);
		best[i] = score(crack_cur[i], 0);
	}

	const int step_iter = 500;
	const int perc_chance_same_venture = 30;
	const int perc_chance_new_venture = 100;
	const int old_venture_step_count = 30;

	char* tmp = malloc(algo_size());
	int looper = 0;
	int printerval = 0;
	int switch_mode = 0;
	while (1)
	{
		if (looper == total) looper = 0;

		if (++switch_mode == 8000) {
			// re-score.
			for (int i = 0; i < total; i++) {
				best[i] = algo_score(crack_best[i], 0);
			}
			switch_mode = 0;
		}


		if (printerval > 2000000) {
			printerval = 0;

			SortEntry scores[1024];
			for (int i = 0; i < total; i++) {
				scores[i].index = i;
				scores[i].score = best[i];
			}

			qsort(scores, total, sizeof(SortEntry), cmp_score);

			printf("==== RANKING ====\n");
			for (int i = 0; i < 10; i++) {
				printf("%d. %ld:", i, scores[i].score);
				algo_score(crack_best[scores[i].index], 1);
			}

			// purge dupes
			for (int i = 1; i < total; i++) {
				int i0 = scores[i - 1].index;
				int i1 = scores[i].index;
				if (best[i0] == best[i1] || i > total * 4 / 5) {
					best[i0] = new_crack(crack_best[i0], &rnd);;
					memcpy(crack_cur[i0], crack_best[i0], algo_size());
				}
			}
		}

		int improvements = 0;
		int last = algo_score(crack_cur[looper], 0);
		int mask = 0xfff;
		for (int step = 0; step < step_iter; step++) {
			printerval++;
			memcpy(tmp, crack_cur[looper], size);
			algo_random_walk(tmp, mask, &rnd);
			int new_score = algo_score(tmp, 0);
			if (new_score > last) {
				memcpy(crack_cur[looper], tmp, size);
				improvements++;
				last = new_score;
				break;
			}
			if (new_score > best[looper]) {
				memcpy(crack_best[looper], tmp, size);
				best[looper] = new_score;
			}
		}

		if (!improvements) {
			// pick a new starting point
			if (rand() % 100 < perc_chance_same_venture) {
				//printf("new venture for %d\n", looper);
				memcpy(crack_cur[looper], crack_best[looper], size);
			}
			else if (rand() % 100 < perc_chance_new_venture) {
				//printf("new venture for %d\n", looper);
				new_crack(crack_cur[looper], &rnd);
			}
			else {
				long tot = 0;
				for (int w = 0; w < total; w++)
					tot += (best[w] >> 16);
				long r = genRandLong(&rnd) % tot;
				int which = 0;
				for (int w = 0; w < total; w++)
				{
					long b = best[w] >> 16;
					if (r <= b) {
						which = w;
						break;
					}
					else {
						r -= b;
					}
				}
				printf("re-venturing %d from point %d\n", looper, which);
				memcpy(crack_cur[looper], crack_cur[which], size);
				long mask = genRandLong(&rnd);
				for (int k = 0; k < old_venture_step_count; k++)
					algo_random_walk(crack_cur[looper], mask, &rnd);
			}
		}

		++looper;
	}
}