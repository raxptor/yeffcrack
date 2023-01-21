const float en_freq[] = { 8.34f,1.54f,2.73f,4.14f,12.60f,2.03f,1.92f,6.11f,6.71f,0.23f,0.87f,4.24f,2.53f,6.80f,7.70f,1.66f,0.09f,5.68f,6.11f,9.37f,2.85f,1.06f,2.34f,0.20f,2.04f,0.06f };
const float en_freq_sorted[] = {
	13.0f, 	9.1f, 8.2f,	7.5f,	7.0f,	6.7f,	6.3f,	6.1f,	6.0f,	4.3f,	4.0f,	2.8f,	2.8f,	2.4f,	2.4f,	2.2,	2.0f,	2.0f,	1.9f,	1.5f,	0.98f,	0.77f,	0.15f,	0.15f,	0.095f,	0.074f
};


int score_freq(const char* buf, int length)
{
	int counts[25];
	int tot = 0;
	for (int i = 0; i < 25; i++)
		counts[i] = 0;

	for (int i = 0; i < length; i++)
	{
		unsigned int w = buf[i] - 'A';
		if (w < 25) {
			counts[w]++;
			++tot;
		}
	}
	float sq = 0;
	for (int i = 0; i < 25; i++)
	{
		float freq = 100.0f * ((float)counts[i] / (float)length);
		float diff = (freq - en_freq[i]);
		sq += diff*diff / en_freq[i];
	}
	return (int)-(100000.0f * sq);
}

typedef struct BFreqEntry_t {
	int index;
	int count;
} BFreqEntry;

int cmp_freqs_b(const void *va, const void *vb)
{
	long a = ((BFreqEntry *)va)->count, b = ((BFreqEntry *)vb)->count;
	return a < b ? 1 : a > b ? -1 : 0;
}

int score_freq_with_sorting_positive(const char* buf, int length)
{
	BFreqEntry freqs[26];
	for (int i = 0; i < 26; i++) {
		freqs[i].count = 0;
		freqs[i].index = i;
	}
	for (int i = 0; i < length; i++) {
		unsigned char c = buf[i] - 'A';
		if (c < 26) {
			freqs[c].count++;
		}
	}
	qsort(freqs, 26, sizeof(BFreqEntry), cmp_freqs_b);
	float sq = 0;
	for (int i = 0; i < 26; i++)
	{
		float freq = 100.0f * ((float)freqs[i].count / (float)length);
		float ref = en_freq_sorted[i];
		float diff = (freq - ref);
		sq += (diff * diff) / ref;
	}
	return (int)(1000.0f * sq);

}