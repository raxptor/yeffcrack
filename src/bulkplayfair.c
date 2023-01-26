#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>



static void source_box(char *buf, const char *word, MTRand *rand)
{
	char used[256];
	memset(buf, 0x00, 26);
	memset(used, 0x00, 26);
	if (!word) word = word_get_random((genRandLong(rand)%10)+4, rand);
	int p = 0;
	int len = strlen(word);
	for (int i = 0; i < 40 && i < len; i++) {
		char c = word[i];
		if (!used[c-'A'] && c != 'J') {
			buf[p++] = c;
			used[c-'A'] = 1;
		}
	}
	const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i] - 'A';
		if (!used[c]) {
			buf[p++] = c + 'A';
			used[c] = 1;
		}
	}
	buf[25] = 0;
	// printf("word box is %s [%s]\n", buf, word);
}

void source_box_random(char* buf, MTRand* rand)
{
	char used[256];
	memset(buf, 0x00, 26);
	memset(used, 0x00, 26);

	int p = 0;
	for (unsigned int i = 0; i < 40; i++) {
		char c = genRandLong(rand) % 26;
		if (!used[c] && (c + 'A') != 'J') {
			buf[p++] = c + 'A';
			used[c] = 1;
		}
	}
	const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i];
		if (!used[c - 'A']) {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
	buf[25] = 0;
}

void revindex(char* buf)
{
	buf[25] = 0;
	for (unsigned int i = 0; i < 25; i++)
	{
		buf[32 + buf[i] - 'A'] = i;
	}
}

static int compute_playfair(char* out, const char* box, const char* txt, int len)
{
	for (int i=0;i<(len-1);i+=2) {
		int c0, c1, c2, c3;
		int r0, r1, r2, r3;
		int i0 = box[32+txt[i] - 'A'];
		int i1 = box[32+txt[i+1] - 'A'];
		c0 = i0 % 5;
		r0 = i0 / 5;
		c1 = i1 % 5;
		r1 = i1 / 5;
		if (c0 == c1 && r0 == r1) {
			return 0;
		} else if (r0 == r1) {
			r2 = r0;
			r3 = r1;
			c2 = (c0 + 4) % 5;
			c3 = (c1 + 4) % 5;
		} else if (c0 == c1) {
			c2 = c0;
			c3 = c1;
			r2 = (r0 + 4) % 5;
			r3 = (r1 + 4) % 5;
		} else {
			c2 = c1;
			c3 = c0;
			r2 = r0;
			r3 = r1;
		}
		out[i] = box[r2 * 5 + c2];
		out[i + 1] = box[r3 * 5 + c3];
	}
	return len;
}

static float eval_crack(const char* box, const char* txt, int len)
{
	char tmp[512];
	if (!compute_playfair(tmp, box, txt, len))
		return 0;
	char counts[26];
	memset(counts, 0x00, 26);
	for (int i = 0; i < len; i++)
		counts[tmp[i] - 'A']++;
	int ic = 0;
	for (int i = 0; i < 26; i++)
		ic += (int)counts[i] * ((int)counts[i] - 1);
	return (float)ic / (float)(len * (len - 1));	
}

static void random_step(char* perm, MTRand* rand, int len)
{
	int a, b;
	do {
		a = genRandLong(rand) & 31;
		b = genRandLong(rand) & 31;
	} while (a == b || a >= len || b >= len);
	char t = perm[a];
	perm[a] = perm[b];
	perm[b] = t;
}

typedef struct AEvalEntry_t {
	int index;
	float eval;
} AEvalEntry;

int cmp_eval_a(const void* va, const void* vb)
{
	float a = ((AEvalEntry*)va)->eval, b = ((AEvalEntry*)vb)->eval;
	return a < b ? 1 : a > b ? -1 : 0;
}

AEvalEntry eval_entry[65536];

void bulk_analyze_playfair(const char* txt, const char* order)
{
	int len = strlen(txt);
	int idx = 0;
	const char* word;
	while (word = word_by_index(idx)) {
		char box[64];
		source_box(box, word, 0);
		revindex(box);
		eval_entry[idx].eval = eval_crack(box, txt, len);
		eval_entry[idx].index = idx;
		++idx;
	}
	int count = idx;

//	fprintf(stderr, "I evaluated %d entries\n", count);
	qsort(eval_entry, count, sizeof(AEvalEntry), cmp_eval_a);
	int best_rating = -1;
	char best_result[1024];
	char best_alphabet[64];
	strcpy(best_result, "ZILCH");
	strcpy(best_alphabet, "NO ALPHABET");
	MTRand rnd = seedRand(0x8fe2d2c0 + 40);
	for (int i = 0; i < 16; i++) {
		if (eval_entry[i].eval < 0)
			break;
		int w = eval_entry[i].index;
		char box[64];
		source_box(box, word_by_index(w), 0);
		revindex(box);

		char tmp[512];
		if (!compute_playfair(tmp, box, txt, len)) {
			continue;
		}
		
		tmp[len] = 0;

		char alphabet[26];
		int quadgrammio = quick_subst_eval(tmp, &rnd, alphabet);
		for (int i = 0; i < len; i++) {
			tmp[i] = alphabet[tmp[i] - 'A'];
		}
		if (quadgrammio > best_rating || best_rating == -1) {
			// printf("%f eval => %s rates %d\n", eval_entry[i].eval, tmp, quadgrammio);
			strcpy(best_result, tmp);
			alphabet[25] = 0;
			strcpy(best_alphabet, alphabet);
			best_rating = quadgrammio;
		}
	}
	printf("\"%s\": { \"cracked\": \"%s", txt, best_result);
	printf("\", \"quadgram_rating\": \"%d\", \"alphabet\": \"%s\" }\n", best_rating, best_alphabet);
}
