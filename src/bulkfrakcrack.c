#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <intrin.h>

#define PERMS_6 (6 * 5 * 4 * 3 * 2 * 1)
#define CHOOSE_14_6 3003

const int perms_6 = PERMS_6;
const int selections_6 = CHOOSE_14_6;

typedef struct FrakCrack_t {
	const char* inputBuffer;
	int length, rows;
	// 
	int result_count;
	int max_results;
	int result_width;
	int* penalties;
	char* results;

	char* columns_buffer;
	char* premix_buffer;
	char** columns;

	// tmp data
	int width;
	int leave_columns;
	int remaining[16];

	int selection_bits[CHOOSE_14_6];
	char counts_segments[25 * CHOOSE_14_6 * PERMS_6];

	char selection[64];
	int num_selections;
	
	int perm[16];

	// output resluts
	float best_rating;
	int best_columns[64];
	int best_width;
	char best_alphabet[32];
	char best_text[256];
} FrakCrack;

static void swap(int* a, int* b)
{
	int tmp = *a;
	*a = *b;
	*b = tmp;
}

static void eval_perm_complete(FrakCrack* ck)
{
	/*
	int rows = ck->length / ck->width;

	// Ciphertext is taken out by columns.
	for (int i = 0; i < ck->width; i++) {
		int src_col = ck->perm[i];
		int src_offset = ck->perm[i] * rows; // stored by column in the source, 
		for (int j = 0; j < rows; j++) {
			// We write both options, with input written by columns or not.
			bufU[j * ck->width + i] = ck->inputBuffer[j * ck->width + src_col];
			bufT[j * ck->width + i] = ck->inputBuffer[src_offset + j];
		}
	}

	memset(finU, '?', ck->length);
	memset(finT, '?', ck->length);
	for (int i = 0; i < ck->length; i++) {
		finU[i] = bufU[ck->outputOrder[i]];
		finT[i] = bufT[ck->outputOrder[i]];
	}
	// Now we have some options to consider.
	finU[ck->length] = 0;
	finT[ck->length] = 0;

	if (ck->result_count + 2 >= ck->max_results) {
		fprintf(stderr, "Exhausted results array.\n");
	}
	else {
		int i0 = ck->result_count++;
		int i1 = ck->result_count++;
		memcpy(&ck->results[i0 * ck->result_width], finU, ck->length);
		memcpy(&ck->results[i1 * ck->result_width], finT, ck->length);
		ck->penalties[i0] = compute_penalty(finU, ck->length);
		ck->penalties[i1] = compute_penalty(finT, ck->length);
	}
	//printf("%s -> %d\n", finU, compute_penalty(finU, ck->length));
	//printf("%s -> %d\n", finT, compute_penalty(finT, ck->length));
	*/
}

static void enum_perm(FrakCrack* ck, int depth)
{
	// first we pick one free.
	ck->perm[depth] = ck->remaining[0];


	int left = ck->width - depth;
	for (int i = 0; i < left; i++) {
		ck->perm[depth] = ck->remaining[i];

		swap(&ck->remaining[i], &ck->remaining[left - 1]);
		if ((left - 1) <= ck->leave_columns) {
			// fill out with whatever is left.
			int at = ck->width - ck->leave_columns;
			int src = 0;
			while (at < ck->width) {
				ck->perm[at++] = ck->remaining[src++];
			}
			eval_perm_complete(ck);
		}
		else {
			enum_perm(ck, depth + 1);
		}
		swap(&ck->remaining[i], &ck->remaining[left - 1]);
	}
}

static void make_perm_any(int* order, int columns, int perm_idx)
{
	for (int c = 0; c < columns; c++)
		order[c] = c;
	for (int c = 0; c < columns; c++) {
		int nl = columns - c;
		int which = c + perm_idx % nl;
		perm_idx /= nl;
		swap(&order[which], &order[c]);
	}
}

static void make_perm_6(int* order, int perm_idx)
{
	const int columns = 6;
	for (int c = 0; c < columns; c++)
		order[c] = c;
	for (int c = 0; c < columns; c++) {
		int nl = columns - c;
		int which = c + perm_idx % nl;
		perm_idx /= nl;
		swap(&order[which], &order[c]);
	}
}

#define FC_IS_EVEN ((fc->width&1) == 0)
#define ODD_IS_GOOD(row, column) ((r^c)&1) == 0

static void crack_selection_6(FrakCrack* fc)
{
	const int columns = 6;
	int num_perm = 1;
	for (int i = 1; i <= columns; i++)
		num_perm *= i;

	int order[8] = { 0 };
	for (int p = 0; p < num_perm; p++) {
		int cur_p = p;
		make_perm_6(order, p);
		int counts[25] = { 0 };

		unsigned int subidx = (fc->num_selections * PERMS_6 + p) * 25;
		char* res_array = &fc->counts_segments[subidx];

		int debug = 0;
		for (int odd = 0; odd < 2; odd++) {

			if (FC_IS_EVEN && odd > 0)
				break;
			for (int c = odd; c < (columns-1); c += 2) {
				int c0 = fc->selection[order[c]];
				int c1 = fc->selection[order[c + 1]];
				char *pm = &fc->premix_buffer[(c0 * fc->width + c1) * fc->rows];

				if (FC_IS_EVEN) {
					for (int r = 0; r < fc->rows; r++) {
						res_array[pm[r]]++;
					}
				} else {
					for (int r = 0; r < fc->rows; r++) {
						if (ODD_IS_GOOD(r, c)) {
							res_array[pm[r]]++;
							debug++;
						}
					}
				}
			}
		}
	}
}

void next_selection(FrakCrack* fc, int i, int max, int cursor)
{
	int remaining = max - i;
	if (remaining > 0) {
		int rightmost = fc->width - remaining + 1;
		while (cursor < rightmost) {
			fc->selection[i] = cursor;
			next_selection(fc, i + 1, max, cursor + 1);
			++cursor;
		}
	} else {
		int bits = 0;
		for (int i = 0; i < max; i++)
			bits |= (1 << fc->selection[i]);
		fc->selection_bits[fc->num_selections] = bits;
		/*
		printf("One selection ready:");
		for (int i = 0; i < max; i++)
			printf("%d ", fc->selection[i]);
		printf("\n");
		*/
		crack_selection_6(fc);
		fc->num_selections++;
	}
}


typedef struct AICEntry_t {
	int segment;
	int count;
	int bits;
	float ic;
} AICEntry;

static int cmp_ic(const void *va, const void *vb)
{
	float a = ((AICEntry *)va)->ic, b = ((AICEntry *)vb)->ic;
	return a < b ? 1 : a > b ? -1 : 0;
}

static AICEntry g_entries_sorted[CHOOSE_14_6 * PERMS_6];

void make_columns(int* out, int width, AICEntry* entry)
{
	int columns[32];
	int p = 0;
	for (int i = 0; i < width; i++) {
		if (entry->bits & (1 << i))
			columns[p++] = i;
	}
	int order[6];
	make_perm_6(order, entry->segment % PERMS_6);
	for (int i = 0; i < 6; i++)
		out[i] = columns[order[i]];
}

static float ic_from_counts(int* counts, int* in_alles)
{
	int ic = 0, tot = 0;
	for (int c = 0; c < 25; c++) {
		ic += counts[c] * (counts[c] - 1);
		tot += counts[c];
	}
	*in_alles = tot;
	return (float)ic / (float)(tot*(tot - 1));
}

static char get_premix(FrakCrack* fc, int c0, int c1, int row)
{
	return fc->premix_buffer[(c0 * fc->width + c1) * fc->rows + row];
}

void have_12_fill_remaining(FrakCrack* fc, int has, int idx_i, int idx_j)
{
	AICEntry a = g_entries_sorted[idx_i];
	AICEntry b = g_entries_sorted[idx_j];

	int cols_left[12];
	int remaining = 0;
	int perms = 1;
	for (int i = 0; i < fc->width; i++) {
		if (!(has & (1 << i))) {
			cols_left[remaining++] = i;
			perms *= remaining;
		}
	}
	// fprintf(stderr, "Remaining columns %d with %d permutations to search\n", remaining, perms);

	int columns[64];
	make_columns(&columns[0], fc->width, &g_entries_sorted[idx_i]);
	make_columns(&columns[6], fc->width, &g_entries_sorted[idx_j]);

	for (int p = 0; p < perms; p++) {
		int order[6];
		make_perm_any(order, remaining, p);
		for (int k = 0; k < remaining; k++) {
			columns[12 + k] = cols_left[order[k]];
		}

		// Prep with counts that we already have.
		int counts[25];
		char *cnt0 = &fc->counts_segments[a.segment * 25];
		char *cnt1 = &fc->counts_segments[b.segment * 25];
		int total; float ic;

		if (FC_IS_EVEN) {
			for (int c = 0; c < 25; c++) {
				counts[c] = cnt0[c] + cnt1[c];
			}
			// Fill in remaining
			for (int k = 12; k < (fc->width - 1); k++) {
				int c0 = columns[k];
				int c1 = columns[k + 1];
				char *pm = &fc->premix_buffer[(c0 * fc->width + c1) * fc->rows];
				for (int r = 0; r < fc->rows; r++) {
					counts[pm[r]]++;
				}
			}
			ic = ic_from_counts(counts, &total);
		} else {
			// Let's do it the slow way.
			char buf[1024];
			for (int i = 0; i < fc->width; i++) {
				char* coldata = fc->columns[columns[i]];
				for (int r = 0; r < fc->rows; r++) {
					buf[r * fc->width + i] = coldata[r] - '1';
				}
			}
			int amt = fc->width * fc->rows / 2;
			int rd = 0;
			memset(counts, 0x00, 25 * sizeof(int));
			for (int k = 0; k < amt; k++) {
				char c0 = buf[rd++];
				char c1 = buf[rd++];
				counts[c0 * 5 + c1]++;
			}
			ic = ic_from_counts(counts, &total);
		}
		if (ic > fc->best_rating) {
			fc->best_rating = ic;
			fprintf(stderr, "Highest rating ");
			char inv[64];
			for (int k = 0; k < fc->width; k++) {
				fc->best_columns[k] = columns[k];
				inv[columns[k]] = 'A' + k;
				fprintf(stderr, "%c", 'A' + columns[k]);
			}
			inv[fc->width] = 0;
			fprintf(stderr, " inv %s => %f\n", inv, ic);
		}
	}

}

void find_combinations(FrakCrack* fc)
{
	if (fc->width < 12) {
		fprintf(stderr, "No need to find combinations!");
	} else {
		int search_count = 2000;
		for (int i = 0; i < search_count; i++) {
			int max = fc->num_selections * PERMS_6;
			int bits_i = g_entries_sorted[i].bits;
			int left_to_search = search_count;
			for (int j = 0; j < max && left_to_search > 0; j++) {
				int bits_j = g_entries_sorted[j].bits;
				if (__popcnt(bits_i|bits_j) == 12) {
					have_12_fill_remaining(fc, bits_i | bits_j, i, j);
					//printf("one match [%d:%d] %d + %d = %d\n", i, j, __popcnt(bits_i), __popcnt(bits_j), __popcnt(bits_i | bits_j));
					--left_to_search;
				}
			}
		}
	}
}


void make_ic_table(FrakCrack* fc)
{
	char* buf = fc->counts_segments;
	int items = fc->num_selections * PERMS_6;
	for (int i = 0; i < items; i ++) {
		int val[32];
		for (int c = 0; c < 25; c++)
			val[c] = buf[c] * (buf[c] - 1);
		int tot = 0;
		for (int c = 0; c < 25; c++)
			tot += buf[c];
		int sum = 0;
		for (int c = 0; c < 25; c++)
			sum += val[c];
		g_entries_sorted[i].segment = i;
		g_entries_sorted[i].count = sum;
		g_entries_sorted[i].bits = fc->selection_bits[i / PERMS_6];
		g_entries_sorted[i].ic = (float)sum / (float)(tot * (tot-1));
		buf += 25;
	}
	fprintf(stderr, "Made ic table with %d items\n", items);
	qsort(g_entries_sorted, fc->num_selections, sizeof(AICEntry), cmp_ic);
	fprintf(stderr, "Sorted it.");
	find_combinations(fc);
}

void frak_crack(FrakCrack* fc, int width)
{
	fc->rows = fc->length / width;
	fc->width = width;
	fc->columns_buffer = (char*)malloc(fc->width * fc->rows);
	fc->columns = (char**)malloc(sizeof(char*) * fc->width);
	for (int i = 0; i < width; i++) {
		fc->columns[i] = (fc->columns_buffer + i * fc->rows);
		for (int j = 0; j < fc->rows; j++) {
			fc->columns[i][j] = fc->inputBuffer[width * j + i];
			fc->columns[i][fc->rows] = 0;
		}
		printf("Column %d = %s\n", i, fc->columns[i]);
	}

	fc->premix_buffer = (char*)malloc(fc->rows * fc->width * fc->width);
	for (int a = 0; a < width; a++) {
		for (int b = 0; b < width; b++) {
			char* ca = fc->columns[a];
			char* cb = fc->columns[b];
			char* out = &fc->premix_buffer[(a * fc->width + b) * fc->rows];
			for (int i = 0; i < fc->rows; i++) {
				out[i] = (ca[i] - '1') * 5 + (cb[i] - '1');
			}
		}
	}

	fc->leave_columns = 0;
	fc->max_results = 100000;
	fc->result_count = 0;
	fc->result_width = 256;
	fc->penalties = (int*)malloc(sizeof(int) * fc->max_results);
	fc->results = (char*)malloc(fc->result_width * fc->max_results);
	for (int i = 0; i < fc->width; i++)
		fc->remaining[i] = i;

	next_selection(fc, 0, 6, 0);
	fprintf(stderr, "There were %d selections\n", fc->num_selections);

	make_ic_table(fc);



	/*
	enum_perm(fc, 0);
	*/
}


void bulk_analyze_frakcrack(const char* buf, const char* orderBuf)
{
	int txtLen = strlen(buf);
	// int orderLen = strlen(orderBuf);
	//if (2 * txtLen != orderLen) {
	//	fprintf(stderr, "orderLen != textLen * 2 (%d %d)\n", orderLen, txtLen);
	//	return;
	//}

	FrakCrack* csc = malloc(sizeof(FrakCrack));
	memset(csc, 0x00, sizeof(FrakCrack));
	csc->length = txtLen;
	csc->inputBuffer = buf;
	strcpy(csc->best_alphabet, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");

	frak_crack(csc, 13);

	/*
	int orderLen = strlen(orderBuf);
	if (2 * txtLen != orderLen) {
		fprintf(stderr, "orderLen != textLen * 2 (%d %d)\n", orderLen, txtLen);
		return;
	}

	char preTransp[512];
	int order[512];
	for (int i = 0; i < txtLen; i++) {
		char a = orderBuf[2 * i] - 'A';
		char b = orderBuf[2 * i + 1] - 'A';
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
			int divider = 4;
			if (w <= 4) divider = 1;
			try_columns(&csc, w, divider);
		}
	}

	printf("\"%s\": { \"cracked\": \"%s", buf, csc.best_text);
	printf("\", \"quadgram_rating\": \"%d\", \"meta_transposition_order\": \"%s\", \"best_width\": %d, \"alphabet\": \"%s\" }\n", csc.best_rating, orderBuf, csc.best_width, csc.best_alphabet);
	*/
}