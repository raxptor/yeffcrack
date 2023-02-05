#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static void bulk_analyze_freq(const char *buf)
{
	char tmp[1024];
	strcpy(tmp, buf);
	int len = strlen(buf);
	int freq_score = score_freq_with_sorting_positive(tmp, len);

	printf("\"%s\": { \"freq_rating\": \"%d\" }\n", buf, freq_score);
}

static void source_double_alphabet(char *buf, MTRand *rand)
{
	char used[256];
	memset(buf, 0x00, 64);
	memset(used, 0x00, 26);

/*
	char* word = "MANCHESTR";
	int p = 0;
	int len = strlen(word);
	for (int i = 0; i < 40 && i < len; i++) {
		char c = word[i];
		if (!used[c - 'A'] && c != 'J') {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}*/
	int p = 0;
	for (unsigned int i = 0; i < 40; i++) {
		char c = genRandLong(rand) % 26;
		if (!used[c]) {
			if ((c + 'A') != 'J') {
				buf[p++] = c + 'A';
				used[c] = 1;
			}
		}
	}

	const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZJ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i];
		if (!used[c - 'A']) {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
	char *firstbox = buf + 32;
	for (int i = 0; i < 32; i++) {
		int val = genRandLong(rand) % 5;
		firstbox[i] = val;
	}
}


typedef struct AFreqEntry_t {
	int index;
	int count;
} AFreqEntry;

static int cmp_freqs_a(const void *va, const void *vb)
{
	long a = ((AFreqEntry *)va)->count, b = ((AFreqEntry *)vb)->count;
	return a < b ? 1 : a > b ? -1 : 0;
}

static void make_freq_alphabet(char* alphabet, const char* buf, int len)
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

static float ic_from_counts(unsigned char* counts, int* in_alles)
{
	int ic = 0, tot = 0;
	for (int c = 0; c < 25; c++) {
		ic += (int)counts[c] * (int)(counts[c] - 1);
		tot += (int)counts[c];
	}
	*in_alles = tot;
	return (float)ic / (float)(tot*(tot - 1));
}


static int eval_crack(const char *alphabet, const char* buf, int len)
{
	const char *first = alphabet + 32;
	const char *second = alphabet;

	char tmp[4096];
	unsigned char counts[32];
	memset(counts, 0x00, 32);
	int tmplen = 0;
	for (int i = 0; i < (len-1); i+=2)
	{
		char c1 = buf[i];
		char c2 = buf[i + 1];
		char o = first[c1 * 5 + c2];
		if (o != -1)
			tmp[tmplen++] = o;
	}
	int outp = 0;
	for (int i = 0; i < (tmplen - 1); i += 2)
	{
		char c1 = tmp[i];
		char c2 = tmp[i + 1];
		char o = second[c1 * 5 + c2];
		counts[c1 * 5 + c2]++;
		tmp[outp++] = o;
	}
	int tot;
	float ic = ic_from_counts(counts, &tot);
	float fac = 1.0f;
	if (ic < 0.0440f) fac = 0.90f;
	if (ic > 0.0650f || tot < 35) fac = 0.03f;
	return fac * 98 * quadgram_score_buf(tmp, outp) / (outp+1);
}

static void print_crack(void* whereto, const char *alphabet, const char* buf, int len)
{
	const char *first = alphabet + 32;
	const char *second = alphabet;

	char tmp[4096];
	int tmplen = 0;
	for (int i = 0; i < (len - 1); i += 2)
	{
		char c1 = buf[i];
		char c2 = buf[i + 1];
		char o = first[c1 * 5 + c2];
		if (o != -1)
			tmp[tmplen++] = o;
	}
	int outp = 0;
	for (int i = 0; i < (tmplen - 1); i += 2)
	{
		char c1 = tmp[i];
		char c2 = tmp[i + 1];
		tmp[outp++] = second[c1 * 5 + c2];
	}

	tmp[outp] = 0;
	fprintf(whereto, "%s", tmp);
}

void first_box_ops(char* alphabet, MTRand* rand)
{
	int a = genRandLong(rand) & 0xffffff;
	int op = a >> 16;
	int val0 = a & 0xff;
	int val1 = (a >> 8) & 0xff;
	if (op < 32) {
		int which = val0 % 25;
		// toggle one between null or not		
		if (alphabet[which] == -1)
			alphabet[which] = (val1 % 5);
		else
			alphabet[which] = -1;
		//alphabet[which] = (val1 % 5);
	} else {
		permutation_walk(alphabet, rand, 25);
	}
}


void bulk_analyze_double_polybius(const char* txt, const char* order)
{
	char buf[1024];
	int src_len = strlen(txt);
	int len = 0;
	for (int i = 0; i < src_len; i++) {
		switch (txt[i]) {
			case '6': buf[len++] = 0; break;
			case '7': buf[len++] = 1; break;
			case '8': buf[len++] = 2; break;
			case '9': buf[len++] = 3; break;
			case '0': buf[len++] = 4; break;
			case '1': buf[len++] = 0; break;
			case '2': buf[len++] = 1; break;
			case '3': buf[len++] = 2; break;
			case '4': buf[len++] = 3; break;
			case '5': buf[len++] = 4; break;
		}
	}
	buf[len] = 0;

	char tmp[1024];
	strcpy(tmp, buf);
	int freq_score = score_freq(tmp, len);

	MTRand rnd = seedRand(0x8fe2d2c0 + 40);

	char best[64], workfrom[64];
	memset(best, 0x00, 64);
	memset(tmp, 0x00, 64);
	source_double_alphabet(best, &rnd);
	memcpy(workfrom, best, 64);
	int best_score = eval_crack(best, buf, len);
	int cur_score = 0;
	int failures = 0;
	for (int i = 0; i < 12000000; i++)
		//for (int i = 0; i < 2069; i++)
	{
		memcpy(tmp, workfrom, 64);
		if (!(i & 1))
			permutation_walk(tmp, &rnd, 25);
		else
			first_box_ops(tmp + 32, &rnd);
		int score = eval_crack(tmp, buf, len);
		if (score > cur_score)
		{
			memcpy(workfrom, tmp, 64);
			cur_score = score;
			if (score > best_score)
			{
				memcpy(best, tmp, 64);
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
			if (++failures > 10000) {
				cur_score = 0;

				for (int i = 0; i < 20; i++)
				{
					source_double_alphabet(tmp, &rnd);
					int eval = eval_crack(tmp, buf, len);
					if (!i || eval > cur_score)
					{
						cur_score = eval;
						memcpy(workfrom, tmp, 64);
					}
				}

				failures = 0;
			}
		}
	}

	printf("\"%s\": { \"cracked\": \"", txt);
	print_crack(stdout, best, buf, len);
	printf("\", \"quadgram_rating\": \"%d\", \"alphabet\": \"%s\" }\n", best_score, best);
}


