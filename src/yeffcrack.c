#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <memory.h>
#include <io.h>
#include "all.h"

int scoring = 0;

int algo_score(void* ptr, t_score_fn fn, int print) {
	char tmp0[1024];
	char tmp1[1024];
	algo_run_data run;
	run.crack = ptr;
	run.tmp0 = tmp0;
	run.tmp1 = tmp1;
	algo_run(&run, print);
	return fn(run.output, run.length);
}

int user_chosen_scoring(const char* buf, int length)
{
	int diff;
	switch (scoring) {
		case 0: 
			return quadgram_score_buf(buf, length);
		case 1:
			diff = (compute_ic(buf, length) - ENGLISH_IC);
			return 1000000000 - diff * diff;
		default:
			printf("Invalid scoring!");
			exit(-1);
			break;
	}
}

int no_score(const char* buf, int length)
{
	return 0;
}

void call_analyze(char *name, const char*buf, const char*order)
{
	fprintf(stderr, "Analyze[%s] called with [%s] and [%s]\n", name, buf, order);
	if (!strcmp(name, "freq"))
		bulk_analyze_freq(buf);
	if (!strcmp(name, "subst"))
		bulk_analyze_subst(buf);
	if (!strcmp(name, "colsubst"))
		bulk_analyze_colsubst(buf, order);
}

int main(int argc, char *argv[])
{
	trigram_init();
	quadgram_init();
	words_init();
	MTRand rnd = seedRand(0x8fe2d2c0);

	for (int i = 0; i < argc; i++) {
		if (i < (argc - 1)) {
			if (!strcmp(argv[i], "--scoring")) {
				if (!strcmp(argv[i + 1], "ic")) {
					scoring = 1;
				} else {
					fprintf(stderr, "Invalid scoring mode.\n");
					exit(1);
				}
			} else if (!strcmp(argv[i], "--stdin-analyze")) {
				size_t bufsize = 1024 * 1024 * 12;
				char *buf = malloc(bufsize);
				int pos = 0;
				while (1) {
					int r = fread(&buf[pos], 1, bufsize - pos, stdin);
					if (r <= 0) break;
					pos += r;
				}
				buf[pos] = 0;
				const char* delim = "\n\r";
				char *token = strtok(buf, delim);
				printf("{\n");
				int first = 1;
				while (token) {
					if (!first) printf(", ");

					char tmp[4096];
					strcpy(tmp, token);
					int l = strlen(tmp);
					char* _ck = token;
					char* _order = "";
					for (int k = 0; k < l; k++) {
						if (tmp[k] == '|') {
							tmp[k] = 0;
							_ck = tmp;
							_order = &tmp[k + 1];
							break;
						}
					}

					call_analyze(argv[i + 1], _ck, _order);
					token = strtok(0, delim);
					first = 0;
				}
				printf("}\n");
				return 0;
			} if (!strcmp(argv[i], "--debug-analyze")) {
				call_analyze(argv[i + 1], 
					//"UXFRVNRABEDUFLFWGCFECUFRACDNKIDWDCDMGACQNFXXENBFCLDUNRFBEPLDUXREDHKDCEUEBDCNFACMFRFLSRDNDFQFSBBFUDRIBKFDNUFCEXBXRFCQEDFMDACQNFHDUPGPBFURMVQCONESREDRWDGSUDBCPPGDFPKQKGBPDOCRAFDVQBXRCKFKPODCPYFRQOBN",
					"KPIPBKLIMKQQPDQLQBOEBMCGQRPIDPONLIENDCDPQMPMIKENPIBDONTBDLBGIEBBILPEMOQBOPPNNDQKLPIRCDQGLPGCLPKMKDCMFXLRNCTAACOPPAOOEPBKCMEICNCAUCQPKOLHKATMHMBMPPMDDHDMKDMHFALLTMOMMFIPNLBIPMCPICPMBMANBBKMOGKGINDG",
					// n=10
					//"WHUAOTOFRSEMVIYTRTISOHMEETTCIRIEMHDEVIYTGWTWINSRHAAHFOOETWFLRBSEEESSIDSHIIEATFRGTMOHETOENTAEAARPPCTTETIAOHDSTWRTEOTWIMNSTIGANEHLREYOIURLBTNGHSOVPSEEKEYOILLRPYTENLDIAADKYLTMAIEEOWNDUDITLOLOKEHNXXKTAXXX",
					"AABYDXFWABCADYFXACCBEAFYADCCEBGAAECDECGBAFCEEDGCAGCFEEGDAHCGEFGEAICHEGGFAJCIEHGGAKCJEIGHALCKEJGIAMCLEKGJANCMELGKAOCNEMGLAPCOENGMAQCPEOGNARCQEPGOASCREQGPATCSERGQAUCTESGRAVCUETGSAWCVEUGTAXCWEVGUAYCXEWGVBACYEXGWBBDAEYGXBCDBFAGYBDDCFBHABEDDFCHBBFDEFDHCBGDFFEHDBHDGFFHEBIDHFGHFBJDIFHHGBKDJFIHHBLDKFJHIBMDLFKHJBNDMFLHKBODNFMHLBPDOFNHMBQDPFOHNBRDQFPHOBSDRFQHPBTDSFRHQBUDTFSHRBVDUFTHSBWDVFUHTBXDWFVHU");
				return 0;
			}
		}
	}

	printf("Is fractionated: %d\n", algo_is_fractionated());
	{ // verification
		void* vf = malloc(algo_size());
		algo_initial_guess(vf, 1, &rnd);
		algo_score(vf, &no_score, 1);
	}

	printf("Scoring mode is %d\n", scoring);
	hillclimb();

	return 0;
}
