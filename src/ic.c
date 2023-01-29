// See define ENGLISH_IC in all.h


float compute_ic_f(const char* buf, int len)
{
	int counts[25];
	int tot = 0;
	for (int i = 0; i < 25; i++)
		counts[i] = 0;

	for (int i = 0; i < len; i++)
	{
		unsigned int w = buf[i] - 'A';
		if (w < 25) {
			counts[w]++;
			++tot;
		}
	}

	int num = 0;
	int den = 0;
	for (int i = 0; i < 25; i++)
	{
		num += counts[i] * (counts[i] - 1);
		den += counts[i];
	}

	if (den == 0)
		return 0;
	return ((float)num) / (float)(den * (den - 1));
}


int compute_ic(const char* buf, int len)
{
	return (int)(100000 * compute_ic_f(buf, len));
}
