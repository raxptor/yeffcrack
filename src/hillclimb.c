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

int frac_transp_stage_score(const char* buf, int length)
{
	int diff = (compute_ic(buf, length) - ENGLISH_IC);
	return 1000000000 - diff * diff;
}

int frac_polybius_stage_score(const char* buf, int length)
{
	return 1000000000 + score_freq(buf, length);
}

int new_crack(void *p, t_score_fn scoring, MTRand* rand)
{
	char buf[1024];
	
	if (algo_is_fractionated()) {
		const int frac_rand_starts = 120; // number of random configurations to try out.
		char gen[1024];
		int best = -1;
		for (int i = 0; i < frac_rand_starts; i++) {
			algo_initial_guess(gen, 0, rand); // NOTE: This also randomises everything else, might not be necessary.
			int score = algo_score(gen, scoring, 0);
			if (!i || score >= best) {
				best = score;
				memcpy(p, gen, algo_size());
			}
		}
		return best;
	} else {
		const int random_starts = 120; // number of random configurations to try out.
		int best = -1;
		for (int i = 0; i < random_starts; i++)
		{
			algo_initial_guess(buf, 1, rand);
			int score = algo_score(buf, &user_chosen_scoring, 0);
			if (!i || score >= best) {
				best = score;
				memcpy(p, buf, algo_size());
			}
		}
		return best;
	}	
}

void hillclimb_single(char* cur, t_score_fn scoring, int mask, int step_size, int max_iterations, MTRand* rnd)
{
	int best = scoring(cur, algo_size());
	int since_improv = 0;
	while (since_improv < max_iterations) {
		char tmp[256];
		memcpy(tmp, cur, algo_size());
		for (int i=0;i<step_size;i++)
			algo_random_walk(tmp, mask, rnd);
		int score = algo_score(tmp, scoring, 0);
		if (score > best) {
			best = score;
			memcpy(cur, tmp, algo_size());
			since_improv = 0;
		}
		else {
			since_improv++;
		}
	}
}

typedef struct FreqEntry_t {
	int index;
	int count;
} FreqEntry;

int cmp_freqs(const void *va, const void *vb)
{
	long a = ((FreqEntry *)va)->count, b = ((FreqEntry *)vb)->count;
	return a < b ? 1 : a > b ? -1 : 0;
}

void make_freq_polybius(void* ptr)
{
	// make ABCDEF... 
	char rpoly[25];
	permutation_reset(rpoly, 25, 'A');
	algo_reset_data rd;
	memset(&rd, 0x00, sizeof(rd));
	rd.polybius = rpoly;
	algo_reset(ptr, &rd);

	char tmp0[1024];
	char tmp1[1024];
	algo_run_data run;
	run.crack = ptr;
	run.tmp0 = tmp0;
	run.tmp1 = tmp1;
	algo_run(&run, 0);

	FreqEntry freqs[25];
	for (int i = 0; i < 25; i++) {
		freqs[i].count = 0;
		freqs[i].index = i;
	}
	for (int i = 0; i < run.length; i++) {
		unsigned char c = run.output[i] - 'A';
		if (c < 25) {
			freqs[c].count++;
		}
	}
	qsort(freqs, 25, sizeof(FreqEntry), cmp_freqs);
	char polybius[25];
	const char* order = "ETAINOSHRDLUCMFWYGPBVKQXZ";
	for (int i = 0; i < 25; i++) {
		polybius[freqs[i].index] = order[i];
	}
	rd.polybius = polybius;
	algo_reset(ptr, &rd);
}

void hillclimb()
{
	MTRand rnd = seedRand(0x8fe2d2c0 + time(0));

	#define TOPLIST_SIZE 10
	#define TOPLIST_SORTER 200
	#define TOPLIST_ENTRIES (TOPLIST_SIZE+TOPLIST_SORTER)
	const int toplist_tot = TOPLIST_ENTRIES;
	void* crack_toplist[TOPLIST_ENTRIES];
	int score_toplist[TOPLIST_ENTRIES];
	SortEntry toplist_se[TOPLIST_ENTRIES];

	for (int i = 0; i < toplist_tot; i++)
		crack_toplist[i] = malloc(algo_size());
	for (int i = 0; i < toplist_tot; i++)
		toplist_se[i].index = i;
	
	int best_ever = INT_MIN;

	int writeptr = 0;


	int print_ratio = 4;
	int topiter = 99999;
	while (1)
	{
		// Hill climb a new entry.
		char cur[256];
		if (algo_is_fractionated() && 1) {
			new_crack(cur, frac_transp_stage_score, &rnd);
			hillclimb_single(cur, frac_transp_stage_score, RNDWALK_TRANSPOSITION, 1, 2000, &rnd);
			make_freq_polybius(cur);
		} else {
			new_crack(cur, user_chosen_scoring, &rnd);
		}
		
		//make_freq_polybius(cur);
		/*hillclimb_single(cur, user_chosen_scoring, 0xfffff, 4, 1000, &rnd);
		hillclimb_single(cur, user_chosen_scoring, 0xfffff, 3, 1000, &rnd);
		hillclimb_single(cur, user_chosen_scoring, 0xfffff, 2, 1000, &rnd);
		*/
		hillclimb_single(cur, user_chosen_scoring, 0xfffff, 1, 500, &rnd);
		int score = algo_score(cur, user_chosen_scoring, 0);
		if (score > best_ever) {
			printf("Score: %d ", score);
			algo_score(cur, user_chosen_scoring, 1);
			best_ever = score;
		}
		int windex = toplist_se[writeptr].index;
		memcpy(crack_toplist[windex], cur, algo_size());
		score_toplist[windex] = score;

		++writeptr;
		if (writeptr == toplist_tot) {

			for (int i = 0; i < toplist_tot; i++)
			{
				toplist_se[i].score = score_toplist[i];
				toplist_se[i].index = i;
			}
			qsort(toplist_se, toplist_tot, sizeof(SortEntry), cmp_score);
			writeptr = TOPLIST_SIZE;

			if (++topiter >= print_ratio) {
				printf("==== RANKING ====\n");
				for (int i = 0; i < TOPLIST_SIZE; i++) {
					printf("%d. %ld:", i, toplist_se[i].score);
					algo_score(crack_toplist[toplist_se[i].index], &user_chosen_scoring, 1);
				}
				topiter = 0;
			}			
		}

	}
}
