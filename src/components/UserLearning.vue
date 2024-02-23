<template>
  <div>
    <div style="display: flex">
      <div style="padding-top: 60px;padding-left: 60px; text-align: left;width: 440px">
        <div style="display: flex">总人数：
          <el-input v-model="userTotalNumber" style="width: 80px "></el-input>
        </div>
        <div>人群数：
          <el-input v-model="clusterNumber" style="width: 80px "></el-input>
        </div>
        <div>用户平均点击率：
          <el-input v-model="avgRate" style="width: 80px "></el-input>
        </div>
        <div>策略给获奖电影带来的点击率提升：
          <el-input v-model="awIncrease" style="width: 80px "></el-input>
        </div>
        <div>实验运行天数：
          <el-input :value="totalDays" @input="totalDays=Number($event)" style="width: 80px "></el-input>
        </div>
        <div>第几天开启实验：
          <el-input v-model="expDay" style="width: 80px "></el-input>
        </div>
        <el-button @click="run" v-loading="running">run</el-button>
      </div>
      <div class="scatter" ref="scatter"></div>
      <div class="line" ref="line"></div>
    </div>
    <div style="display:flex">
      <div class="ccd-no-recommend" ref="ccdNoRecommend"></div>
      <div class="ccd" ref="ccd"></div>
      <div class="ccd-freeze" ref="ccdFreeze"></div>
    </div>
  </div>
</template>

<script>
import {initScatterChart} from "@/components/ScatterChart";
import {uniformGen} from "@/components/Uniform";
import {betaGen, rbeta} from "@/components/Beta";
import {initLineChart} from "@/components/LineChart";
import {initLineChart2} from "@/components/LineChart2";

export default {
  name: 'UserLearning',
  data() {
    return {
      userTotalNumber: 12000,
      clusterNumber: 4,
      awIncrease: 0.5,
      avgRate: 0.25,
      totalDays: 50,
      expDay: 10,

      userPreference: [],
      ccdResult: [],

      ccdEffect: [],
      ccdFreezeEffect: [],
      ccdNoRecommendEffect: [],
      running: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.run();
    })
  },
  methods: {
    run() {
      this.running = true;
      let userPreference = this.genUserPreference();
      this.userPreference = userPreference;
      let ccdResult = this.genCCD(userPreference);
      initScatterChart(this.$refs.scatter, [['alpha', 'beta', 'cluster'], ...userPreference], this.clusterNumber);
      initLineChart(this.$refs.line, ccdResult);
      initLineChart2(this.$refs.ccd, this.ccdEffect, 'ccd effect')
      initLineChart2(this.$refs.ccdNoRecommend, this.ccdNoRecommendEffect, 'ccd no recommend effect')
      initLineChart2(this.$refs.ccdFreeze, this.ccdFreezeEffect, 'ccd freeze effect')
      this.running = false;
    },
    genUserPreference() {
      let data = [];
      let ssum = 0, awsum = 0;
      let clusters = uniformGen(0.05, 0.5, 2, this.clusterNumber);
      clusters.map(e => {
        ssum += e[0];
        awsum += e[1]
      });
      clusters = clusters.map(e => {
        return [e[0] - ssum / this.clusterNumber + Number(this.avgRate), e[1] - awsum / this.clusterNumber + Number(this.avgRate)]
      });
      // clusters = [[0.25,0.05],[0.1,0.2],[0.35,0.3],[0.3,0.45]];
      for (let c = 0; c < clusters.length; c++) {
        for (let i = 0; i < this.userTotalNumber / this.clusterNumber; i++) {
          data.push([betaGen(clusters[c][0]), betaGen(clusters[c][1]), c])
        }
      }
      return this.shuffle(data);
    },
    shuffle(a) {
      for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
      }
      return a;
    },
    genCCD(userPreference) {
      let noRecommendData = this.runCCDNoRecommend(userPreference);
      let recommendData = this.runCCDWithRecommend(userPreference);
      let ccdFreeze = this.runCCDFreeze(userPreference);
      // let clusterCCD = this.runClusterCCD(userPreference);
      this.effectCountCCDFreeze(ccdFreeze);
      this.effectCountCCD(recommendData);
      this.effectCountCCDNoRecommend(noRecommendData);
      return [['Day', 'Rate', 'Method'],
        ...this.watchRateCount(noRecommendData, 'CCD-NoRecommend'),
        ...this.watchRateCount(recommendData, 'CCD'),
        // ...this.watchRateCount(clusterCCD, 'Cluster-CCD'),
        ...this.watchRateCount(ccdFreeze, 'CCD-Freeze'),
      ]
    },
    effectCountCCDFreeze(result) {
      let CC = this.watchCount(result.filter(e => e[5] === 'CC'));
      let CT = this.watchCount(result.filter(e => e[5] === 'CT'));
      let CDT = this.watchCount(result.filter(e => e[5] === 'CDT'));
      let CF = this.watchCount(result.filter(e => e[5] === 'CF'));
      this.ccdFreezeEffect = [['Day', 'Rate', 'Effect'],
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CF[0][e] - CDT[0][e]) / CDT[1][e], 'UserLearning'];
        }),
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CT[0][e] - CF[0][e]) / CF[1][e], 'Personalization'];
        }),
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CDT[0][e] - CC[0][e]) / CC[1][e], 'Direct'];
        }),
      ]
    },
    effectCountCCD(result) {
      let CC = this.watchCount(result.filter(e => e[5] === 'CC'));
      let CT = this.watchCount(result.filter(e => e[5] === 'CT'));
      let CDT = this.watchCount(result.filter(e => e[5] === 'CDT'));
      this.ccdEffect = [['Day', 'Rate', 'Effect'],
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CT[0][e] - CDT[0][e]) / CDT[1][e], 'UserLearning'];
        }),
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CDT[0][e] - CC[0][e]) / CC[1][e], 'Direct'];
        }),
      ]
    },
    effectCountCCDNoRecommend(result) {
      let CC = this.watchCount(result.filter(e => e[5] === 'CC'));
      let CT = this.watchCount(result.filter(e => e[5] === 'CT'));
      let CDT = this.watchCount(result.filter(e => e[5] === 'CDT'));
      this.ccdNoRecommendEffect = [['Day', 'Rate', 'Effect'],
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CT[0][e] - CDT[0][e]) / CDT[1][e], 'UserLearning'];
        }),
        ...[...new Array(this.totalDays).keys()].map(e => {
          return [e, (CDT[0][e] - CC[0][e]) / CC[1][e], 'Direct'];
        }),
      ]
    },
    watchCount(watchData) {
      let dayWatchCount = {};
      let dayTreatedCount = {};
      watchData.map(e => {
        if (!dayTreatedCount[e[0]]) {
          dayTreatedCount[e[0]] = 0;
        }
        if (!dayWatchCount[e[0]]) {
          dayWatchCount[e[0]] = 0;
        }
        dayTreatedCount[e[0]]++
        if (e[3]) {
          dayWatchCount[e[0]]++
        }
      });
      return [dayWatchCount, dayTreatedCount]
    },
    watchRateCount(watchData, method) {
      let [dayWatchCount, dayTreatedCount] = this.watchCount(watchData.filter(e => e[4]));
      return [...new Array(this.totalDays).keys()].map(e => {
        return [e, dayWatchCount[e] / dayTreatedCount[e], method];
      })
    },
    // 4000 / 52 ~= 77 ;  0 C, 1 T, i T;
    runCCDNoRecommend(userPreference) {
      let result = [];//['Day','i','movieType','isWatch','isTreated']
      for (let day = -this.expDay; day < this.totalDays; day++) {
        for (let i = 0; i < userPreference.length; i++) {
          let movieType = Math.floor(Math.random() * 2);
          if (day < 0) {
            // result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CC'])
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 0) {//C
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CC'])
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 1) {//T
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CT'])
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + Number(this.awIncrease) > Math.random(), true, 'CT'])
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) - 2 === day) {//DT
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CDT'])
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + Number(this.awIncrease) > Math.random(), true, 'CDT'])
            }
          } else {//DC
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CDC'])
          }
        }
      }
      return result;
    },
    runClusterCCD(userPreference) {
      let features = [];
      for (let i = 0; i < this.clusterNumber; i++) {
        features.push([{'a': 1, 'b': 1}, {'a': 1, 'b': 1}]);
      }
      let result = []; //['Day','i','movieType','isWatch','isTreated']
      for (let day = -this.expDay; day < this.totalDays; day++) {
        for (let i = 0; i < userPreference.length; i++) {
          let sPr = rbeta(features[userPreference[i][2]][0]['a'], features[userPreference[i][2]][0]['b'])
          let awPr = rbeta(features[userPreference[i][2]][1]['a'], features[userPreference[i][2]][1]['b'])
          let movieType = sPr > awPr ? 0 : 1;
          if (day < 0) {
            if (userPreference[i][movieType] > Math.random()) {
              features[userPreference[i][2]][movieType]['a']++
            } else {
              features[userPreference[i][2]][movieType]['b']++
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 0) {//CT
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[userPreference[i][2]][movieType]['a']++
              } else {
                features[userPreference[i][2]][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + 0.5 > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[userPreference[i][2]][movieType]['a']++
              } else {
                features[userPreference[i][2]][movieType]['b']++
              }
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 1) {//CDT
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[userPreference[i][2]][movieType]['a']++
              } else {
                features[userPreference[i][2]][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + 0.5 > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[userPreference[i][2]][movieType]['a']++
              } else {
                features[userPreference[i][2]][movieType]['b']++
              }
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) - 2 === day) {//CC
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[userPreference[i][2]][movieType]['a']++
            } else {
              features[userPreference[i][2]][movieType]['b']++
            }
          } else {//DC
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CDC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[userPreference[i][2]][movieType]['a']++
            } else {
              features[userPreference[i][2]][movieType]['b']++
            }
          }
        }
      }
      return result;
    },

    // 4000 / 52 ~= 77 ;  0 C, 1 T, i T;
    runCCDWithRecommend(userPreference) {
      let features = [];
      for (let i = 0; i < this.userTotalNumber; i++) {
        features.push([{'a': 1, 'b': 1}, {'a': 1, 'b': 1}]);
      }
      let result = []; //['Day','i','movieType','isWatch','isTreated','Label']
      for (let day = -this.expDay; day < this.totalDays; day++) {
        for (let i = 0; i < userPreference.length; i++) {
          let sPr = rbeta(features[i][0]['a'], features[i][0]['b'])
          let awPr = rbeta(features[i][1]['a'], features[i][1]['b'])
          let movieType = sPr > awPr ? 0 : 1;
          if (day < 0) {
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 0) {//C
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) === 1) {//T
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + 0.5 > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 2))) - 2 === day) {//DT
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + 0.5 > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            }
          } else {//DC
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CDC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          }
        }
      }
      return result;
    },

    // 4000 / 53 ~= 75 ;  0 C, 1 T, i T;
    runCCDFreeze(userPreference) {
      let features = [];
      for (let i = 0; i < this.userTotalNumber; i++) {
        features.push([{'a': 1, 'b': 1}, {'a': 1, 'b': 1}]);
      }

      let result = []; //['Day','i','movieType','isWatch','isTreated']
      for (let day = -this.expDay; day < this.totalDays; day++) {
        for (let i = 0; i < userPreference.length; i++) {
          let sPr = rbeta(features[i][0]['a'], features[i][0]['b'])
          let awPr = rbeta(features[i][1]['a'], features[i][1]['b'])
          let movieType = sPr > awPr ? 0 : 1;
          if (day < 0) {
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 3))) === 0) {//C
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 3))) === 1) {//T
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + Number(this.awIncrease) > Math.random(), true, 'CT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 3))) - 2 === day) {//DT
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + Number(this.awIncrease) > Math.random(), true, 'CDT'])
              if (userPreference[i][movieType] + 0.5 > Math.random()) {
                features[i][movieType]['a']++
              } else {
                features[i][movieType]['b']++
              }
            }
          } else if (Math.floor(i / Math.floor(this.userTotalNumber / (this.totalDays + 3))) === (this.totalDays + 2)) {//CF
            if (movieType === 0) {
              result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), true, 'CF'])
            } else {
              result.push([day, i, movieType, userPreference[i][movieType] + Number(this.awIncrease) > Math.random(), true, 'CF'])
            }
          } else {//DC
            result.push([day, i, movieType, userPreference[i][movieType] > Math.random(), false, 'CDC'])
            if (userPreference[i][movieType] > Math.random()) {
              features[i][movieType]['a']++
            } else {
              features[i][movieType]['b']++
            }
          }
        }
      }
      return result;
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.scatter {
  width: 500px;
  height: 500px;
}

.line {
  width: 500px;
  height: 500px;
}

.ccd {
  width: 500px;
  height: 500px;
}

.ccd-freeze {
  width: 500px;
  height: 500px;
}

.ccd-no-recommend {
  width: 500px;
  height: 500px;
}
</style>