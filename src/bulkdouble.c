#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static int eval_partial_box(char* buf, const char* txt, int* unlocked, char* values, int filter_syms_min)
{
	int pairs = strlen(txt)/2;

	char box[32] = { 0 };
	int s = 0;
	for (int i = 0; i < 32; i++) {
		if (unlocked[i]) {
			box[i] = values[s++];
		}
	}

	char used[32] = { 0 };
	int syms = 0;
	int outp = 0;
	int six_percent = pairs * 6 / 100;
	for (int i = 0; i < pairs; i++)
	{
		int s0 = txt[2 * i] - 'A';
		int s1 = txt[2 * i + 1] - 'A';
		if (box[s0] && box[s1]) {
			int boxidx = 5*(box[s0]-1) + (box[s1]-1);
			++used[boxidx];
			if (used[boxidx] == six_percent)
				syms++;
			buf[outp++] = 'A' + boxidx;
		} else {
			buf[outp++] = ' ';
		}
	}
	if (syms < filter_syms_min)
		return 0;
	return outp;
}

static void brute_force_unlocks(const char* txt, int unlock_count, int* unlocked)
{
	char val[32];
	memset(val, 0x1, 32);

	int combinations = 0;
	int best_eval = 0;
	const int filter_syms_min = unlock_count * 2;
	while (1) {
		++combinations;
		// printf("counting: %d %d %d %d %d %d\n", val[0], val[1], val[2], val[3], val[4], val[5]);		
		char res[512];
		int len = eval_partial_box(res, txt, unlocked, val, filter_syms_min);
		if (len > 0) {
			res[len] = 0;
			int eval = compute_ic(res, len);
			if (eval > best_eval) {
				fprintf(stderr, "Best eval %d with %s\n", eval, res);
				best_eval = eval;
			}
		}

		int p = 0;
		while (++val[p] == 6) {
			val[p] = 1;
			p++;
		}
		if (p == unlock_count)
			break;
	}

	fprintf(stderr, "Done searching %d combinations\n", combinations);
}

static void randomize_unlocks(const char* txt)
{
	int combinations = 0;
	MTRand rnd = seedRand(0x8fe2d2c0 + time(0));
	int best_subst = -1;
	char best_result[512];
	char best_alphabet[128];
	strcpy(best_result, "NOTHING");
	strcpy(best_alphabet, "NO ALPHABET");
	int matched = 0;
	for (int i=0;i<10000;i++)	{
		++combinations;
		int unlocked[32];
		char values[32];
		for (int i = 0; i < 26; i++) {
			unlocked[i] = 1;
			values[i] = (genRandLong(&rnd) & 0xffff) % 5 + 1;
		}
		for (int ofs = 0; ofs < 2; ofs++) {
			char res[512];
			int len = eval_partial_box(res, txt + ofs, unlocked, values, 6);
			if (len > 0) {
				res[len] = 0;
				int eval = compute_ic(res, len);
				int penalty = compute_penalty(res, len);
				if (penalty < 202 && eval > 6200 && eval < 6800) {
					//if (eval > best_eval) {
					matched++;
					char alphabet[64] = { 0 };
					int subst = quick_subst_eval(res, &rnd, alphabet);
					int min_subst = 100000000;
					for (int i = 0; i < len; i++)
						res[i] = alphabet[res[i] - 'A'];
					if (subst > best_subst) {
						best_subst = subst;
						strcpy(best_result, res);
						strcpy(best_alphabet, alphabet);
						fprintf(stderr, "It %d; best %d => %s\n", combinations, best_subst, best_result);
					}
				}
			}
		}
		//printf("%d %d matched\n", i, matched);
	}

	printf("\"%s\": { \"cracked\": \"%s", txt, best_result);
	printf("\", \"quadgram_rating\": \"%d\", \"alphabet\": \"%s\" }\n", best_subst, best_alphabet);

}

void bulk_analyze_double_polybius(const char* txt, const char* order)
{
	randomize_unlocks(txt);
}
