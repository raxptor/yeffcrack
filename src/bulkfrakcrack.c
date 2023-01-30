#define _CRT_SECURE_NO_WARNINGS
#include "all.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <intrin.h>

#define PERMS_6 (6 * 5 * 4 * 3 * 2 * 1)
#define CHOOSE_14_6 3003

#define JUNK_FILTER 1

typedef unsigned char colindex_t;
typedef unsigned char counts_t;

const int perms_6 = PERMS_6;
const int selections_6 = CHOOSE_14_6;

typedef struct FrakCrack_t {
	const char* inputBuffer;
	int length, rows, incomplete;
	int incomplete_rows;
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

	int col_start;
	int col_expected_mask;
	int perms_skipped;
	int perms_included;

	int selection_bits[CHOOSE_14_6];
	char counts_segments[26 * CHOOSE_14_6 * PERMS_6];
	int section_a_count;
	int section_b_count;

	char selection[64];
	int num_selections;

	int col_lengths[32];
	int col_lengths_mask;	
	
	int perm[16];

	// output resluts
	float best_rating;
	int best_columns[64];
	int best_width;
	char best_alphabet[32];
	char best_text[256];

	MTRand rand;
	int best_quad;
} FrakCrack;

static void swap(int* a, int* b) {
	int tmp = *a;
	*a = *b;
	*b = tmp;
}

static void swap_c(colindex_t* a, colindex_t* b) {
	colindex_t tmp = *a;
	*a = *b;
	*b = tmp;
}


void make_col_inverse(colindex_t* inverse, colindex_t* columns, int num)
{
	for (int i = 0; i < num; i++)
	{
		inverse[columns[i]] = i;
	}
}

#define PERM_CACHE_SIZE (5 * 4 * 3 * 2 * 1)
#define PERM_CACHE_WIDTH 6

colindex_t g_perm_cache[PERM_CACHE_SIZE * PERM_CACHE_WIDTH];

static colindex_t* get_perm_any_width(int columns, int perm_idx)
{
	if (perm_idx >= PERM_CACHE_SIZE) {
		fprintf(stderr, "Cache must be bigger!!!");
		exit(1);
	}
	int pos = PERM_CACHE_WIDTH * perm_idx;
	colindex_t* perm = &g_perm_cache[pos + 1];
	if (g_perm_cache[pos] == (colindex_t)columns) {
		return perm;
	}
	else {
		perm[-1] = columns;
		for (colindex_t c = 0; c < columns; c++)
			perm[c] = c;
		for (colindex_t c = 0; c < columns; c++) {
			int nl = columns - c;
			int which = c + perm_idx % nl;
			perm_idx /= nl;
			swap_c(&perm[which], &perm[c]);
		}
		return perm;
	}
}

static void make_perm_6(colindex_t* order, int perm_idx)
{
	const int columns = 6;
	for (int c = 0; c < columns; c++)
		order[c] = c;
	for (int c = 0; c < columns; c++) {
		int nl = columns - c;
		int which = c + perm_idx % nl;
		perm_idx /= nl;
		swap_c(&order[which], &order[c]);
	}
}

#define FC_IS_EVEN ((fc->width&1) == 0)
#define ODD_IS_GOOD(row, column) ((r^c)&1) == 0

void print_configuration(FrakCrack* fc, int* columns)
{
	char txt[1024];
	for (int i = 0; i < fc->width; i++) {
		int src_col = columns[i];
		int length = fc->col_lengths[src_col];
		char* src = fc->columns[src_col];
		for (int r = 0; r < length; r++) {
			txt[r * fc->width + i] = (*src++);
		}
	}
	txt[fc->length] = 0;
	fprintf(stderr, "print_config %s\n", txt);
}

static void make_expected_col_mask(FrakCrack* fc)
{
	fc->col_expected_mask = 0;
	for (int i = 0; i < 6; i++) {
		if ((fc->col_start + i) < fc->incomplete)
			fc->col_expected_mask |= (1 << i);
	}
	fc->perms_skipped = 0;
	fc->perms_included = 0;
}

static int is_valid_perm_char(FrakCrack* fc, colindex_t* selection, colindex_t* order, int num_columns)
{
	int gets_mask = 0;
	for (int i = 0; i < num_columns; i++) {
		if (fc->col_lengths_mask & (1 << (int)selection[order[i]]))
			gets_mask |= (1 << i);
	}
	return gets_mask == fc->col_expected_mask;
}

static void crack_selection_6(FrakCrack* fc)
{
	const int columns = 6;

	int num_perm = 1;
	for (int i = 1; i <= columns; i++)
		num_perm *= i;

	colindex_t order[8] = { 0 };
	for (int p = 0; p < num_perm; p++) {
		int cur_p = p;
		make_perm_6(order, p);

		unsigned int subidx = (fc->num_selections * PERMS_6 + p) * 26;
		char* res_array = &fc->counts_segments[subidx];

		if (!is_valid_perm_char(fc, fc->selection, order, columns)) {
			res_array[25] = 0;
			fc->perms_skipped++;
			continue;
		} else {
			res_array[25] = 1;
			fc->perms_included++;
		}

		int debug = 0;
		for (int odd = 0; odd < 2; odd++) {
			if (FC_IS_EVEN && odd > 0)
				break;
			for (int c = odd; c < (columns-1); c += 2) {
				int c0 = fc->selection[order[c]];
				int c1 = fc->selection[order[c + 1]];
				// we do not go to the incomplete rows here.
				int rows = fc->rows; 
				char *pm = &fc->premix_buffer[(c0 * fc->width + c1) * rows];
				if (FC_IS_EVEN) {
					for (int r = 0; r < rows; r++) {
						res_array[pm[r]]++;
					}
				} else {
					for (int r = 0; r < rows; r++) {
						if (ODD_IS_GOOD(r, c)) {
							res_array[pm[r]]++;
							debug++;
						}
					}
				}
			}
		}

		int sum = 0;
		for (int i = 0; i < 25; i++)
			sum += res_array[i];
		if (FC_IS_EVEN && sum != (3 * fc->rows)) {
			fprintf(stderr, "Now it is wonky, sum is %d\n", sum);
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
		int col_lengths = 0;
		for (int i = 0; i < max; i++) {
			bits |= (1 << fc->selection[i]);
			col_lengths |= fc->col_lengths_mask & (1 << fc->selection[i]);
		}
		int should_have = fc->incomplete - fc->col_start;
		if (should_have < 0) should_have = 0;
		if (should_have > max) should_have = max;
		if (__popcnt(col_lengths) != should_have) {
			return;
		}
		
		fc->selection_bits[fc->num_selections] = bits;
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

static AICEntry g_entries_sorted_0[CHOOSE_14_6 * PERMS_6];
static AICEntry g_entries_sorted_1[CHOOSE_14_6 * PERMS_6];

void make_columns(char* out, int width, AICEntry* entry)
{
	colindex_t columns[32];
	int p = 0;
	for (int i = 0; i < width; i++) {
		if (entry->bits & (1 << i))
			columns[p++] = i;
	}
	colindex_t order[6];
	make_perm_6(order, entry->segment % PERMS_6);
	for (int i = 0; i < 6; i++)
		out[i] = columns[order[i]];
}

static float ic_from_counts(counts_t* counts, int* in_alles)
{
	int ic = 0, tot = 0;
	for (int c = 0; c < 25; c++) {
		ic += (int)counts[c] * (int)(counts[c] - 1);
		tot += (int)counts[c];
	}
	*in_alles = tot;
	return (float)ic / (float)(tot*(tot - 1));
}

static char get_premix(FrakCrack* fc, int c0, int c1, int row)
{
	return fc->premix_buffer[(c0 * fc->width + c1) * fc->incomplete_rows + row];
}

// No incomplete columnar. Not odd.
static void have_all_12_even_steven(FrakCrack* fc, colindex_t* columns, AICEntry a, AICEntry b, float* ic, int* total)
{
	counts_t counts[25];
	char *cnt0 = &fc->counts_segments[a.segment * 26];
	char *cnt1 = &fc->counts_segments[b.segment * 26];
	int tot = 0;
	for (int c = 0; c < 25; c++) {
		counts[c] = cnt0[c] + cnt1[c];
		tot += counts[c];
	}
	// Fill in remaining
	for (int k = 12; k < (fc->width - 1); k+=2) {
		int c0 = columns[k];
		int c1 = columns[k + 1];
		char *pm = &fc->premix_buffer[(c0 * fc->width + c1) * fc->incomplete_rows];
		int rows = fc->col_lengths[c0];
		if (fc->col_lengths[c1] != rows) fprintf(stderr, "Now c0/c1 mismatches.\n");
		for (int r = 0; r < rows; r++) {
			counts[pm[r]]++;
		}
	}
	*ic = ic_from_counts(counts, total);
}

static void have_all_slow(FrakCrack* fc, colindex_t* columns, float* ic, int* total)
{
	// Let's do it the slow way.
	char buf[1024];
	for (int i = 0; i < fc->width; i++) {
		int src_col = columns[i];
		int length = fc->col_lengths[src_col];
		char* src = fc->columns[src_col];
		for (int r = 0; r < length; r++) {
			buf[r * fc->width + i] = (*src++) - '1';
		}
	}
	int amt = fc->length / 2;
	int rd = 0;
	counts_t counts[32];
	memset(counts, 0x00, 25 * sizeof(counts_t));


	char txt[256];
	int outp = 0;
	for (int k = 0; k < amt; k++) {
		char c0 = buf[rd++];
		char c1 = buf[rd++];
		char letter = c0 * 5 + c1;
		if (JUNK_FILTER) txt[outp++] = letter + 'A';
		counts[letter]++;
	}
	txt[outp] = 0;

	if (JUNK_FILTER) {
		int penalty = compute_penalty(txt, outp - 3);
		if (penalty > 10) {
			*ic = 0;
			*total = outp;
			return;
				//fprintf(stderr, "Filtered junk...\n");
		}
		int max0 = 0, max1 = 0;
		for (int i = 0; i < 25; i++) {
			if (counts[i] > max0) max0 = counts[i];
		}
		for (int i = 0; i < 25; i++) {
			if (counts[i] != max0 && counts[i] > max1) max1 = counts[i];
		}
		if (max0 * 7 > outp || max1 * 7 > outp) {
			*ic = 0;
			*total = outp;
			return;
		}
	}


	// print_configuration(fc, columns);
	*ic = ic_from_counts(counts, total);
	if (2 * (*total) != 2*(fc->length/2)) {
		fprintf(stderr, "Aaah! Invalid length in output.\n");
	}

	if (JUNK_FILTER) {
		/*
		if (*ic > (fc->best_rating - 0.007433)) {
			char alphabet[64];
			//strcpy(txt, "FAILURESTODECIPHERMAKEMESCRYWONDERFULLSLOWLYROLLINGWATERZUCCHINIFRUITORNOTWHOKNOWSSTUPIDITYWRENCH");
			int quad = quick_subst_eval(txt, &fc->rand, alphabet);
			if (quad > fc->best_quad) {
				fprintf(stderr, "Best quad %d : ", quad);
				for (int i = 0; i < outp; i++)
					txt[i] = alphabet[txt[i] - 'A'];
				fprintf(stderr, "%s\n", txt);
				fc->best_quad = quad;
			} else {
				*ic = 0;
			}
		}
		*/
	}
}


static int depth_i, depth_j;
static int idx_i, idx_j;

float rating_at_width[32];

static void on_result(FrakCrack* fc, colindex_t* columns, float ic, int total)
{
	if (2*total != (fc->length & 0xfffe)) {
		fprintf(stderr, "Ah! %d != %d\n", total, fc->length);
		return;
	}
	if (ic > fc->best_rating) {
		fc->best_rating = ic;
		rating_at_width[fc->width] = ic;

		fprintf(stderr, "Highest rating at width %d ", fc->width);
		for (int k = 0; k < fc->width; k++) {
			fc->best_columns[k] = columns[k];
			fprintf(stderr, "%c", 'A' + columns[k]);
		}
		fprintf(stderr, " => %f (depth:%d %d)\n", ic, depth_i, depth_j);
		if (fc->width > 12)
			if (0) {
				fprintf(stderr, " A[0]=%f A[i]=%f   B[0]=%f B[j]=%f\n", g_entries_sorted_0[0].ic, g_entries_sorted_0[idx_i].ic,
					g_entries_sorted_1[0].ic, g_entries_sorted_1[idx_j].ic);
				fprintf(stderr, " A[%d]=%f B[%d]=%f\n", fc->section_a_count - 1, g_entries_sorted_0[fc->section_a_count - 1].ic,
					fc->section_b_count - 1, g_entries_sorted_1[fc->section_b_count - 1].ic);
				if (fc->section_a_count >= 20000)
					fprintf(stderr, " A[%d]=%f\n", 20000, g_entries_sorted_0[20000].ic);
				if (fc->section_b_count >= 20000)
					fprintf(stderr, " B[%d]=%f\n", 20000, g_entries_sorted_1[20000].ic);
			}
	}
}

static void have_12_fill_remaining(FrakCrack* fc, int has, int idx_i, int idx_j)
{
	colindex_t cols_left[12];
	int remaining = 0;
	int perms = 1;
	for (int i = 0; i < fc->width; i++) {
		if (!(has & (1 << i))) {
			cols_left[remaining++] = i;
			perms *= remaining;
		}
	}

	// fprintf(stderr, "Remaining columns %d with %d permutations to search\n", remaining, perms);
	colindex_t columns[64];
	make_columns(&columns[0], fc->width, &g_entries_sorted_0[idx_i]);
	make_columns(&columns[6], fc->width, &g_entries_sorted_1[idx_j]);

	for (int p = 0; p < perms; p++) {
		colindex_t* order = get_perm_any_width(remaining, p);

		int valid = 1;
		for (int k = 0; k < remaining; k++) {
			int col = cols_left[order[k]];
			int expect_long = (12 + k) < fc->incomplete;
			int is_long = (fc->col_lengths_mask & (1 << col)) ? 1 : 0;
			if (expect_long != is_long) {
				valid = 0;
				break;
			}
			columns[12 + k] = col;
		}
		
		if (!valid) {
			continue;
		}

		float ic = -1;
		int total;
		if (!fc->incomplete && FC_IS_EVEN && !JUNK_FILTER) {
			have_all_12_even_steven(fc, columns, g_entries_sorted_0[idx_i], g_entries_sorted_1[idx_j], &ic, &total);
			on_result(fc, columns, ic, total);
		} else {
			int total = 0;
			have_all_slow(fc, columns, &ic, &total);
			on_result(fc, columns, ic, total);
		}
	}
}

static void have_6_fill_remaining(FrakCrack* fc, int has, int idx_i)
{
	colindex_t cols_left[12];
	int remaining = 0;
	int perms = 1;
	for (int i = 0; i < fc->width; i++) {
		if (!(has & (1 << i))) {
			cols_left[remaining++] = i;
			perms *= remaining;
		}
	}

	// fprintf(stderr, "Remaining columns %d with %d permutations to search\n", remaining, perms);
	colindex_t columns[64];
	make_columns(&columns[0], fc->width, &g_entries_sorted_0[idx_i]);

	for (int p = 0; p < perms; p++) {
		colindex_t* order = get_perm_any_width(remaining, p);
		int valid = 1;
		for (int k = 0; k < remaining; k++) {
			int col = cols_left[order[k]];
			int expect_long = (6 + k) < fc->incomplete;
			int is_long = (fc->col_lengths_mask & (1 << col)) ? 1 : 0;
			if (expect_long != is_long) {
				valid = 0;
				break;
			}
			columns[6 + k] = col;
		}
		if (!valid) {
			continue;
		}

		float ic = -1;
		int total;
		have_all_slow(fc, columns, &ic, &total);
		on_result(fc, columns, ic, total);
	}
}

static void have_0_fill_remaining(FrakCrack* fc)
{
	int perms = 1;
	char col_ch[16];
	for (int i = 0; i < fc->width; i++) {
		perms *= (i+1);
		col_ch[i] = i;
	}

	fprintf(stderr, "Searching %d permutations at width %d...\n", perms, fc->width);
	for (int p = 0; p < perms; p++) {
		colindex_t* order = get_perm_any_width(fc->width, p);
		if (!is_valid_perm_char(fc, col_ch, order, fc->width))
			continue;

		float ic = -1;
		int total;
		have_all_slow(fc, order, &ic, &total);
		on_result(fc, order, ic, total);
	}
}

void find_combinations(FrakCrack* fc)
{
	if (fc->width < 6) {
		have_0_fill_remaining(fc);
	} else if (fc->width < 12) {
		int search_count = 80000;
		for (int i = 0; i < search_count && i < fc->section_a_count; i++) {
			depth_i = i;
			int max = fc->num_selections * PERMS_6;
			int bits = g_entries_sorted_0[i].bits;
			have_6_fill_remaining(fc, bits, i);
		}
	} else {
		int search_count = 2000;
		int max_a = fc->section_a_count;
		int max_b = fc->section_b_count;
		// i + j
		for (int i = 0; i < search_count && i < max_a; i++) {
			int bits_i = g_entries_sorted_0[i].bits;
			int left_to_search = search_count;
			depth_j = 0;
			depth_i = i;
			idx_i = i;
			for (int j = 0; j < max_b && left_to_search > 0; j++) {
				int bits_j = g_entries_sorted_1[j].bits;
				if (__popcnt(bits_i|bits_j) == 12) {					
					// printf("one match [%d:%d] %d + %d = %d\n", i, j, __popcnt(bits_i), __popcnt(bits_j), __popcnt(bits_i | bits_j));
					have_12_fill_remaining(fc, bits_i | bits_j, i, j);
					idx_j = j;
					depth_j++;
					--left_to_search;
				}
			}
		}
		// j + i
		for (int j = 0; j < search_count > 0; j++) {
			int bits_j = g_entries_sorted_1[j].bits;
			idx_j = j;
			depth_j = j;
			depth_i = 0;
			for (int i = 0; i < search_count && i < max_a; i++) {
				int bits_i = g_entries_sorted_0[i].bits;
				int left_to_search = search_count;				
				if (__popcnt(bits_i | bits_j) == 12) {
					// printf("one match [%d:%d] %d + %d = %d\n", i, j, __popcnt(bits_i), __popcnt(bits_j), __popcnt(bits_i | bits_j));
					idx_i = i;
					have_12_fill_remaining(fc, bits_i | bits_j, i, j);
					depth_i++;
					--left_to_search;
				}
			}
		}
	}
}


int make_ic_table(FrakCrack* fc, AICEntry* table)
{
	char* buf = fc->counts_segments;
	int items = fc->num_selections * PERMS_6;
	int p = 0;
	for (int i = 0; i < items; i ++) {
		if (buf[25]) {
			int val[32];
			for (int c = 0; c < 25; c++)
				val[c] = buf[c] * (buf[c] - 1);
			int tot = 0;
			for (int c = 0; c < 25; c++)
				tot += buf[c];
			int sum = 0;
			for (int c = 0; c < 25; c++)
				sum += val[c];
			table[p].segment = i;
			table[p].count = sum;
			table[p].bits = fc->selection_bits[i / PERMS_6];
			table[p].ic = (float)sum / (float)(tot * (tot - 1));
			++p;
		}
		buf += 26;
	}
	//fprintf(stderr, "Made ic table with %d items starting at col %d\n", p, fc->col_start);
	qsort(table, p, sizeof(AICEntry), cmp_ic);
	//fprintf(stderr, "Sorted it.\n");	
	return p;
}

void frak_crack(const char* txt, int txtLen, int width)
{
	FrakCrack* fc = malloc(sizeof(FrakCrack));
	memset(fc, 0x00, sizeof(FrakCrack));
	fc->length = txtLen;
	fc->inputBuffer = txt;

	fc->rows = fc->length / width;
	fc->incomplete_rows = (fc->length + width - 1) / width;
	fc->incomplete = fc->length % width;
	fc->width = width;
	fc->columns_buffer = (char*)malloc((fc->width) * (fc->rows + 2));
	fc->columns = (char**)malloc(sizeof(char*) * fc->width);
	fc->premix_buffer = (char*)malloc(fc->incomplete_rows * fc->width * fc->width);

	fc->leave_columns = 0;
	fc->max_results = 100000;
	fc->result_count = 0;
	fc->result_width = 256;
	fc->penalties = (int*)malloc(sizeof(int) * fc->max_results);
	fc->results = (char*)malloc(fc->result_width * fc->max_results);
	fc->rand = seedRand(0x8fe2d2c0);

	fc->best_rating = 0;
	
	int combinations = 1;
	for (int i = 0; i < fc->width; i++) {
		fc->remaining[i] = i;
		combinations *= 2;
	}

	fprintf(stderr, "=====> frak_crack at width %d <========\n", width);
	for (int combination = 0; combination < combinations; combination++) {
		if (__popcnt(combination) != fc->incomplete)
			continue;

		fc->col_lengths_mask = combination;
		for (int i = 0; i < fc->width; i++) {
			fc->col_lengths[i] = fc->rows + ((combination & (1 << i)) ? 1 : 0);
		}

		if (0) {
			fprintf(stderr, "Assuming column lengths (%x) => ", combination);
			for (int i = 0; i < fc->width; i++) {
				fprintf(stderr, "%d ", fc->col_lengths[i]);
			}
			fprintf(stderr, "\n");
		}

		const char* source = fc->inputBuffer;
		char* out = fc->columns_buffer;
		for (int i = 0; i < width; i++) {
			fc->columns[i] = out;
			for (int j = 0; j < fc->col_lengths[i]; j++) {
				fc->columns[i][j] = *source++;
				out++;
			}
			*out++ = 0;
		}

		for (int a = 0; a < width; a++) {
			for (int b = 0; b < width; b++) {
				char* ca = fc->columns[a];
				char* cb = fc->columns[b];
				char* out = &fc->premix_buffer[(a * fc->width + b) * fc->rows];
				int rows = fc->incomplete_rows;
				for (int i = 0; i < fc->rows; i++) {
					out[i] = (ca[i] - '1') * 5 + (cb[i] - '1');
				}
			}
		}

		if (width < 6) {
			fc->col_start = 0;
			make_expected_col_mask(fc);
			find_combinations(fc);
		} else if (width < 12) {
			fc->col_start = 0;
			fc->num_selections = 0;
			memset(fc->counts_segments, 0x00, sizeof(fc->counts_segments));
			make_expected_col_mask(fc);
			next_selection(fc, 0, 6, 0);
			fc->section_a_count = make_ic_table(fc, g_entries_sorted_0);
			//fprintf(stderr, ".... searching 6 combination %d out of %d ... (%d)\n", combination, combinations, fc->section_a_count);
			find_combinations(fc);
		} else {
			fc->col_start = 0;
			fc->num_selections = 0;
			memset(fc->counts_segments, 0x00, sizeof(fc->counts_segments));
			make_expected_col_mask(fc);
			next_selection(fc, 0, 6, 0);
			fc->section_a_count = make_ic_table(fc, g_entries_sorted_0);
			// fprintf(stderr, " => Section A had %d selections*perms PermSkipped %d PermIncluded %d\n", fc->section_a_count, fc->perms_skipped, fc->perms_included);
			
			fc->col_start = 6;
			fc->num_selections = 0;
			memset(fc->counts_segments, 0x00, sizeof(fc->counts_segments));

			make_expected_col_mask(fc);
			next_selection(fc, 0, 6, 0);
			fc->section_b_count = make_ic_table(fc, g_entries_sorted_1);
			// fprintf(stderr, " => Section B had %d selections*perms PermSkipped %d PermIncluded %d\n", fc->section_b_count, fc->perms_skipped, fc->perms_included);
			//fprintf(stderr, "Searching 6+6 combination %d out of %d ... (%dx%d)\n", combination, combinations, fc->section_a_count, fc->section_b_count);
			find_combinations(fc);
		}
	}
}


void bulk_analyze_frakcrack(const char* buf, const char* orderBuf)
{
	int txtLen = strlen(buf);
	frak_crack(buf, txtLen, 11);
	const int thinnest = 4, widest = 14;
	for (int w = thinnest; w <= widest; w++) {
		frak_crack(buf, txtLen, w);
	}
	printf("\"%s\": { \"frak_scores\": \"", buf);
	for (int w = thinnest; w <= widest; w++) {
		printf("%d ", (int)(10000 * rating_at_width[w]));
	}
	printf("\" } ");
}