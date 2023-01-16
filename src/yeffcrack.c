#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include "all.h"

int best_ever = 0;

void permutation_walk(char* perm, MTRand* rand, int len)
{
	int whatToDo = genRandLong(rand) & 0xff;
	if (whatToDo < 10) {
		// mirror
		char tmp[128];
		memcpy(tmp, perm, len);
		for (int i = 0; i < len; i++) {
			perm[i] = tmp[len-1-i];
		}
	} else if (whatToDo < 50 && len > 4) {
		// pivot swap
		// 012 3456
		int pivot = 1 + genRandLong(rand) % (len - 2);
		char tmp[128];
		memcpy(tmp, perm, len);
		int outp = 0;
		for (int i = 0; i < (len - pivot); i++) {
			perm[outp++] = tmp[pivot + i];
		}
		for (int i = 0; i < pivot; i++) {
			perm[outp++] = tmp[i];
		}
	} else if (whatToDo < 100) {
		// rotate left
		char t = perm[0];
		for (int i = 0; i < len-1; i++)
			perm[i] = perm[i + 1];
		perm[len - 1] = t;
	} else {
		// swap 2
		int a, b;
		do {
			a = genRandLong(rand) & 63;
			b = genRandLong(rand) & 63;
		} while (a == b || a >= len || b >= len);
		char t = perm[a];
		perm[a] = perm[b];
		perm[b] = t;
	}
}

int score(const char* buf, int length)
{
	return score_freq(buf, length) + trigram_score_buf(buf, length);
}

typedef struct SortEntry_t {
	long score;
	int index;
} SortEntry;

int cmp_score(const void *va, const void *vb)
{
	long a = ((SortEntry *)va)->score, b = ((SortEntry *)vb)->score;
	return a < b ? 1 : a > b ? -1 : 0;
}

char buf[4096];

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
				if (best[i0] == best[i1] || i > total*4/5) {
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
			} else if (rand() % 100 < perc_chance_new_venture) {
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
				for (int k=0;k<old_venture_step_count;k++)
					algo_random_walk(crack_cur[looper], mask, &rnd);
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
