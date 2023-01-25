#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

typedef struct APenaltyEntry_t {
	int index;
	int penalty;
} APenaltyEntry;

int cmp_penalty(const void* va, const void* vb)
{
	long a = ((APenaltyEntry*)va)->penalty, b = ((APenaltyEntry*)vb)->penalty;
	return a < b ? -1 : a > b ? 1 : 0;
}

typedef struct ColSubstCrack_t {
	const char* inputBuffer;
	const int* outputOrder;
	int length;
	// 
	int result_count;
	int max_results;
	int result_width;
	int* penalties;
	char* results;

	// tmp data
	int width;
	int leave_columns;
	int remaining[16];
	int perm[16];
	
	// output resluts
	int best_rating;
	int best_width;
	char best_alphabet[32];
	char best_text[256];	
} ColSubstCrack;

int compute_penalty(const char* buf, int length)
{
	char last = 0;
	int runlength = 0;
	int occurences[16];
	memset(occurences, 0x00, 16 * sizeof(int));

	for (int i = 0; i < (length-14); i++) {
		if (buf[i] != last) {
			last = buf[i];
			runlength = 1;
		} else {
			++runlength;
			if (runlength == 10)
				return 1234567890;
			occurences[runlength]++;
		}
	}

	return occurences[2]
		+ 16 * occurences[3]
		+ 16 * 16 * occurences[4]
		+ 16 * 16 * 16 * occurences[5]
		+ 16 * 16 * 16 * 16 * occurences[6];
}

void swap(int* a, int* b)
{
	int tmp = *a;
	*a = *b;
	*b = tmp;
}

void eval_perm_complete(ColSubstCrack* ck)
{
	char finU[1024];
	char finT[1024];
	char bufU[1024];
	char bufT[1024];
	int rows = ck->length / ck->width;
	
	// Ciphertext is taken out by columns.
	for (int i = 0; i < ck->width; i++) {
		int src_col = ck->perm[i];
		int src_offset = ck->perm[i] * ck->width; // stored by column in the source, 
		for (int j = 0; j < rows; j++) {
			// We write both options, with input written by columns or not.
			bufU[j * ck->width + i] = ck->inputBuffer[j * ck->width + src_col];
			bufT[j * ck->width + i] = ck->inputBuffer[src_offset + j];
		}
	}
	
	for (int i = 0; i < ck->length; i++) {
		finU[ck->outputOrder[i]] = bufU[i];
		finT[ck->outputOrder[i]] = bufT[i];
	}
	// Now we have some options to consider.
	finU[ck->length] = 0;
	finT[ck->length] = 0;

	if (ck->result_count + 2 >= ck->max_results) {
		fprintf(stderr, "Exhausted results array.\n");
	} else {
		int i0 = ck->result_count++;
		int i1 = ck->result_count++;
		memcpy(&ck->results[i0 * ck->result_width], finU, ck->length);
		memcpy(&ck->results[i1 * ck->result_width], finT, ck->length);
		ck->penalties[i0] = compute_penalty(finU, ck->length);
		ck->penalties[i1] = compute_penalty(finT, ck->length);
	}
	// printf("%s -> %d\n", finU, compute_penalty(finU, ck->length));
}

void enum_perm(ColSubstCrack* ck, int depth)
{
	int left = ck->width - depth;
	for (int i = 0; i < left; i++) {
		ck->perm[depth] = ck->remaining[i];

		swap(&ck->remaining[i], &ck->remaining[left - 1]);
		if ((left-1) <= ck->leave_columns) {
			// fill out with whatever is left.
			int at = ck->width - ck->leave_columns;
			int src = 0;
			while (at < ck->width) {
				ck->perm[at++] = ck->remaining[src++];
			}
			eval_perm_complete(ck);
		} else {
			enum_perm(ck, depth + 1);
		}
		swap(&ck->remaining[i], &ck->remaining[left - 1]);
	}
}

void try_columns(ColSubstCrack* ck, int width, int divider)
{
	ck->width = width;
	ck->leave_columns = 0;
	ck->max_results = 100000;
	ck->result_count = 0;
	ck->result_width = 256;
	ck->penalties = (int*)malloc(sizeof(int) * ck->max_results);
	ck->results = (char*)malloc(ck->result_width * ck->max_results);

	for (int i = 0; i < ck->width; i++)
		ck->remaining[i] = i;

	enum_perm(ck, 0);


	APenaltyEntry* entries = (APenaltyEntry*)malloc(ck->max_results * sizeof(APenaltyEntry));
	for (int i = 0; i < ck->result_count; i++) {
		entries[i].penalty = ck->penalties[i];
		entries[i].index = i;
	}
	qsort(entries, ck->result_count, sizeof(APenaltyEntry), cmp_penalty);

	MTRand rnd = seedRand(0x8fe2d2c0);
	//printf("I have %d results to analyze...\n", ck->result_count);
	int check_count = ck->result_count / divider;
	for (int i = 0; i < check_count; i++) {
		//printf("%d (%d)", i, entries[i].penalty);
		char* str = ck->results + ck->result_width * entries[i].index;
		str[ck->length] = 0;
		//printf("%d => %d with %s => ", entries[i].index, entries[i].penalty, str);
		char alphabet[26];
		int eval = quick_subst_eval(str, &rnd, alphabet);
		//printf(" eval %d\n", eval);
		if (eval > ck->best_rating) {			
			ck->best_rating = eval;
			ck->best_width = width;
			memcpy(ck->best_alphabet, alphabet, 26);
			for (int i = 0; i < ck->length; i++)
				ck->best_text[i] = alphabet[str[i]-'A'];
			ck->best_text[ck->length] = 0;
			/*
			printf("\n\nNew best rating: %d ==> ", eval);
				printf("%c", alphabet[str[i] - 'A']);
			printf("\n");
			*/
		}
	}
	free(entries);

	free(ck->penalties);
	free(ck->results);
}


void bulk_analyze_colsubst(const char* buf, const char* orderBuf)
{
	int txtLen = strlen(buf);
	int orderLen = strlen(orderBuf);
	if (2 * txtLen != orderLen) {
		fprintf(stderr, "orderLen != textLen * 2 (%d %d)\n", orderLen, txtLen);
		return;
	}

	char preTransp[512];
	int order[512];
	for (int i = 0; i < txtLen; i++) {
		char a = orderBuf[2*i] - 'A';
		char b = orderBuf[2*i+1] - 'A';
		int idx = 25 * a + b;
		order[i] = idx;
		preTransp[idx] = buf[i];
	}
	preTransp[txtLen] = 0;
	//printf("BEFORE TRANSP:%s\n", preTransp);

	ColSubstCrack csc;
	memset(&csc, 0x00, sizeof(ColSubstCrack));
	csc.length = txtLen;
	csc.inputBuffer = preTransp;
	csc.outputOrder = order;
	strcpy(csc.best_alphabet, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");

	for (int w = 2; w < 8; w++) {
		if ((txtLen % w) == 0) {
			//printf("Column width %d is viable. (%d)\n", w, txtLen);
			int divider = 100;
			if (w <= 4) divider = 1;
			try_columns(&csc, w, divider);
		}
	}
	
	printf("\"%s\": { \"cracked\": \"%s", buf, csc.best_text);	
	printf("\", \"quadgram_rating\": \"%d\", \"best_width\": %d, \"alphabet\": \"%s\" }\n", csc.best_rating, csc.best_width, csc.best_alphabet);
}