#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

void bulk_analyze_freq(const char *buf)
{
	char tmp[1024];
	strcpy(tmp, buf);
	int len = strlen(buf);
	int freq_score = score_freq_with_sorting_positive(tmp, len);

	printf("\"%s\": { \"freq_rating\": \"%d\" }\n", buf, freq_score);
}

void source_alphabet(char *buf, MTRand *rand)
{
	char used[256];
	memset(buf, 0x00, 26);
	memset(used, 0x00, 26);
	const char *word = word_get_random(0, rand);

	int p = 0;
	for (unsigned int i = 0; i < 40; i++) {
		char c = genRandLong(rand) % 26;
		if (!used[c]) {
			buf[p++] = c + 'A';
			used[c] = 1;
		}
	}
	const char* def = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i];
		if (!used[c - 'A']) {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
}


typedef struct AFreqEntry_t {
	int index;
	int count;
} AFreqEntry;

int cmp_freqs_a(const void *va, const void *vb)
{
	long a = ((AFreqEntry *)va)->count, b = ((AFreqEntry *)vb)->count;
	return a < b ? 1 : a > b ? -1 : 0;
}

void make_freq_alphabet(char* alphabet, const char* buf, int len)
{
	AFreqEntry freqs[26];
	for (int i = 0; i < 26; i++) {
		freqs[i].count = 0;
		freqs[i].index = i;
	}
	for (int i = 0; i < len; i++) {
		unsigned char c = buf[i] - 'A';
		if (c < 26) {
			freqs[c].count++;
		}
	}
	qsort(freqs, 26, sizeof(AFreqEntry), cmp_freqs_a);
	const char* order = "ETAINOSHRDLUCMFWYGPBVKQJXZ";
	for (int i = 0; i < 26; i++) {
		alphabet[freqs[i].index] = order[i];
	}
}

int eval_crack(const char *alphabet, const char* buf, int len)
{
	char tmp[4096];
	for (int i = 0; i < len; i++)
	{
		tmp[i] = alphabet[buf[i] - 'A'];
	}
	return quadgram_score_buf(tmp, len);// +score_freq(tmp, len);
}

void print_crack(void* whereto, const char *alphabet, const char* buf, int len)
{
	char tmp[4096];
	for (int i = 0; i < len; i++)
	{
		tmp[i] = alphabet[buf[i] - 'A'];
	}
	tmp[len] = 0;
	fprintf(whereto, "%s", tmp);
}

void guided_swap(char* alphabet, MTRand* rand, int phase)
{
	const int len = 26;
	//                   ABCDEFGHIJKLMNOPQRSTUVWXYZ
	const char* tiers = "10001000100001100001100000";
	// swap 2
	int a, b;
	do {
		a = genRandLong(rand) & 31;
		if (a > 25) continue;
		if (!phase && tiers[alphabet[a] - 'A'] == '0') continue;
		break;
	} while (1);


	do {
		b = genRandLong(rand) & 31;
		if (b > 25 || b == a) continue;
		if (!phase && tiers[alphabet[b] - 'A'] == '0') continue;
		break;
	} while (1);
	char t = alphabet[a];
	alphabet[a] = alphabet[b];
	alphabet[b] = t;
}


void bulk_analyze_subst(const char *buf)
{
	char tmp[1024];
	strcpy(tmp, buf);
	int len = strlen(buf);
	int freq_score = score_freq(tmp, len);

	MTRand rnd = seedRand(0x8fe2d2c0 + 40);

	char best[64], workfrom[64];
	memset(best, 0x00, 64);
	memset(tmp, 0x00, 64);
	source_alphabet(best, &rnd);
	memcpy(workfrom, best, 64);
	int best_score = eval_crack(best, buf, len);
	int cur_score = 0;
	int failures = 0;
	int phase = 0;
	for (int i=0;i<3000000;i++)
	//for (int i = 0; i < 2069; i++)
	{
		memcpy(tmp, workfrom, 26);
		//guided_swap(tmp, &rnd, phase);
		permutation_walk(tmp, &rnd, 26);
		int score = eval_crack(tmp, buf, len);
		if (score > cur_score)
		{
			memcpy(workfrom, tmp, 26);
			cur_score = score;
			if (score > best_score)
			{
				memcpy(best, tmp, 26);
				best_score = score;
				if (1) {
					fprintf(stderr, "%s is best %d (it:%d)", best, score, i);
					print_crack(stderr, tmp, buf, len);
					fprintf(stderr, "\n");
				}
			}
		}
		else
		{
			if (failures > 500)
				phase = 1;

			if (++failures > 3000) {
				cur_score = 0;
				
				
				//make_freq_alphabet(tmp, buf, len);
				source_alphabet(tmp, &rnd);
				//printf("ALPHABET IS %s\n", tmp);
				phase = 1;
				
				for (int i = 0; i < 20; i++)
				{
					if (!i)
						make_freq_alphabet(tmp, buf, len);
					else
						source_alphabet(tmp, &rnd);
					int eval = eval_crack(tmp, buf, len);
					if (!i || eval > cur_score)
					{
						cur_score = eval;
						memcpy(workfrom, tmp, 26);
					}
				}
				
				failures = 0;
			}
		}
	}

	printf("\"%s\": { \"cracked\": \"", buf);
	print_crack(stdout, best, buf, len);
	printf("\", \"quadgram_rating\": \"%d\", \"alphabet\": \"%s\" }\n", best_score, best);
}

static int s_seed = 0x23432412;
int quick_subst_eval(const char* buf, MTRand* rnd, char* best_alphabet)
{
	char tmp[1024];
	strcpy(tmp, buf);
	int len = strlen(buf);
	int freq_score = score_freq(tmp, len);	
	char best[64], workfrom[64];
	memset(best, 0x00, 64);
	memset(tmp, 0x00, 64);
	source_alphabet(best, rnd);
	memcpy(workfrom, best, 64);
	int best_score = eval_crack(best, buf, len);
	int cur_score = 0;
	int failures = 0;
	int phase = 0;
	for (int i = 0; i < 20000; i++)
	{
		memcpy(tmp, workfrom, 26);
		//guided_swap(tmp, &rnd, phase);
		permutation_walk(tmp, rnd, 26);
		int score = eval_crack(tmp, buf, len);
		if (score > cur_score)
		{
			memcpy(workfrom, tmp, 26);
			cur_score = score;
			if (score > best_score)
			{
				memcpy(best, tmp, 26);
				best_score = score;
			}
		}
		else
		{
			if (failures > 500)
				phase = 1;

			if (++failures > 3000) {
				cur_score = 0;
				source_alphabet(tmp, rnd);
				for (int i = 0; i < 20; i++)
				{
					if (!i)
						make_freq_alphabet(tmp, buf, len);
					else
						source_alphabet(tmp, rnd);
					int eval = eval_crack(tmp, buf, len);
					if (!i || eval > cur_score)
					{
						cur_score = eval;
						memcpy(workfrom, tmp, 26);
					}
				}
				failures = 0;
			}
		}
	}
	memcpy(best_alphabet, best, 26);
	return best_score;
}

