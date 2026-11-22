import { normalizeCstr } from '@/utils/cstrUrl'

/** scidb / TPDC 推荐接口返回项（前端写死） */
export type RelatedDatasetItem = {
  datasetId: string
  titleZh: string
  titleEn: string
  keywordZh: string[]
  /** 外部详情页跳转（如 TPDC） */
  url?: string
}

const TPDC_DATA_DETAIL_URL_BASE = 'https://data.tpdc.ac.cn/zh-hans/data/'

export function tpdcDatasetDetailUrl(datasetId: string): string {
  return `${TPDC_DATA_DETAIL_URL_BASE}${datasetId}`
}

/**
 * 图一数据集：中国粉蝶标本图像特征数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460982591491
 */
export const PIERIDAE_FEATURE_DATASET_CSTR = '31253.11.sciencedb.483'
export const PIERIDAE_FEATURE_SCIDB_DATASET_ID = '633694460982591491'

export const PIERIDAE_FEATURE_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'b6a4ab49b58f4d80a7ea2db3e7e5447b',
    titleZh: '广西花坪SITE100样地甲虫标本照片数据集',
    titleEn:
      'A photographic dataset of the beetle specimens from a SITE100 standardized sampling area in Huaping, Guangxi',
    keywordZh: ['形态多样性', '被动采集', '飞行阻隔法', '马氏网法', '罐诱法']
  },
  {
    datasetId: '265465128f5e4149a7c5bd2997029795',
    titleZh: 'A species diversity dataset of beetles in Hong Kong- Shek Pik',
    titleEn: 'A species diversity dataset of beetles in Hong Kong- Shek Pik',
    keywordZh: ['HongKong', 'biodiversity', 'beetles', 'Shek Pik']
  },
  {
    datasetId: '633694460756099072',
    titleZh: '中国凤蝶标本图像特征数据集',
    titleEn: 'Feature dataset of Chinese papilionidae specimen image',
    keywordZh: ['凤蝶科', '标本图像', '图像特征', '模式识别']
  },
  {
    datasetId: 'fee863b6469e4d9bb186576ea0849cc6',
    titleZh: '基于动物志的粉蝶形态特征数据集',
    titleEn: 'A dataset of morphological traits of pierid based on Fauna Sinica',
    keywordZh: ['形态特征', '形态学', '粉蝶', '自然语言处理', '鳞翅目']
  },
  {
    datasetId: '395e28e7230b401b9c13f4e0dc5480de',
    titleZh: '基于动物志的凤蝶和弄蝶形态特征数据集',
    titleEn:
      'A dataset of morphological traits of Papilionidae and Hesperiidae based on Fauna Sinica',
    keywordZh: ['形态特征', '形态学', '凤蝶', '绢蝶', '大语言模型']
  },
  {
    datasetId: '633694461200695296',
    titleZh: '蝴蝶物种自动识别研究的生态照片数据集',
    titleEn: 'A Dataset of Ecological Images for Automatic species-identification of Butterflies',
    keywordZh: ['蝴蝶分类', '生态图片', '自动识别', '目标检测']
  },
  {
    datasetId: '3916839742d5433c9f746cbf0c77ab5a',
    titleZh: 'Beetle Dataset',
    titleEn: 'Beetle Dataset',
    keywordZh: ['Scarabaeidae', 'Research data', 'image classification']
  },
  {
    datasetId: '749219963293663232',
    titleZh: '基于动物志的鸟类形态特征数据集',
    titleEn: 'A dataset of morphological traits of birds based on Fauna Sinica',
    keywordZh: ['性状特征', '形态学', '鸟纲', '自然语言处理']
  },
  {
    datasetId: '633694461079060483',
    titleZh: '2002～2010年中国典型生态系统辐射及光能利用效率数据集',
    titleEn:
      'Radiation and light-use efficiency dataset of typical Chinese ecosystems (2002–2010)',
    keywordZh: ['碳循环', '辐射', '生产力', '涡度相关', '陆地生态系统']
  },
  {
    datasetId: '730374668166365184',
    titleZh: '华南板块古生代维管植物数据集',
    titleEn: 'A dataset of Paleozoic vascular plants from the South China Block',
    keywordZh: ['华南板块', '维管植物', '分类多样性', '形态多样性']
  }
]

/**
 * 图一数据集：2020年海水养殖区矢量数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=771693666518433792
 */
export const MARICULTURE_2020_DATASET_CSTR = '31253.11.sciencedb.00275'
export const MARICULTURE_2020_SCIDB_DATASET_ID = '771693666518433792'

export const MARICULTURE_2020_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '793872127718588416',
    titleZh: '2015–2020年广东省沿岸红树林矢量数据集',
    titleEn: 'A dataset of mangrove vector in the Guangdong province during 2015–2020',
    keywordZh: ['广东省', '红树林', '高分', '高分二号', '遥感', '数据集']
  },
  {
    datasetId: '97209dba6ecb4ff6a8bcf8ebeb741dda',
    titleZh: '基于Landsat数据的海南岛养殖塘变化数据集（1987-2020）',
    titleEn: 'A dataset (1987–2020) of aquaculture ponds in Hainan Island based on Landsat data',
    keywordZh: ['海南岛', '养殖塘', 'Landsat影像', '变化监测']
  },
  {
    datasetId: 'DS_fa416b1385874790b1a5903d62f4983d',
    titleZh: '2015年中国滨海30m分辨率养殖池空间分布动态数据集',
    titleEn:
      "2015 Dynamic Dataset of Spatial Distribution of 30m Resolution Aquaculture Pools in China's Coastal Areas",
    keywordZh: ['中国滨海', '养殖池', '空间分布']
  },
  {
    datasetId: 'DS_65a326d6d0b44db29f4b01138e6a3a59',
    titleZh: '2010年中国滨海30m分辨率养殖池空间分布动态数据集',
    titleEn:
      "2010 Dynamic Dataset of Spatial Distribution of 30m Resolution Aquaculture Pools in China's Coastal Areas",
    keywordZh: ['中国滨海', '养殖池', '2010年']
  },
  {
    datasetId: 'DS_fd60e092f9984e0db5f928fd5e86f295',
    titleZh: '1990年中国滨海30m分辨率养殖池空间分布动态数据集',
    titleEn:
      "Dynamic dataset of spatial distribution of 30 meter resolution aquaculture ponds in China's coastal areas in 1990",
    keywordZh: ['中国滨海', '养殖池', '1990年']
  },
  {
    datasetId: 'DS_74048990e1234e04a060a009aa877349',
    titleZh: '2000年中国滨海30m分辨率养殖池空间分布动态数据集',
    titleEn:
      "2000 Dynamic Dataset of Spatial Distribution of 30m Resolution Aquaculture Pools in China's Coastal Areas",
    keywordZh: ['中国滨海', '养殖池', '2000年']
  },
  {
    datasetId: 'DS_bf9878c225fc4cbf9a7bd35b697c393e',
    titleZh: '30m分辨率中国滨海养殖池空间分布数据集(2015年)',
    titleEn: '30m resolution spatial distribution dataset of coastal aquaculture ponds in China (2015)',
    keywordZh: ['中国', '滨海养殖池', '2015年']
  },
  {
    datasetId: '5214b31810db49b8bbfdc1243ce5c56b',
    titleZh: 'A dataset of 10-m annual coastal aquaculture ponds in China and Vietnam from 2015 to 2020',
    titleEn: 'A dataset of 10-m annual coastal aquaculture ponds in China and Vietnam from 2015 to 2020',
    keywordZh: [
      'Coastal aquaculture ponds',
      'China and Vietnam',
      'Remote Sensing',
      'Spatiotemporal distribution',
      'Coastal zones'
    ]
  },
  {
    datasetId: '703004029558456320',
    titleZh: '2008-2018年夏季北极海冰物理参数原位观测数据集',
    titleEn: 'In situ observation data set of physical parameters of Arctic sea ice in summer of 2008-2018',
    keywordZh: ['北极', '海冰', '夏季', '冰温', '盐度', '密度', '晶体结构']
  },
  {
    datasetId: '15d0e920875e4575b94d728aae06a691',
    titleZh: '香河光解速率数据集',
    titleEn: 'Photolysis rate data set of Xianghe',
    keywordZh: ['光解', '臭氧', '香河']
  }
]

/**
 * 广东土种志——基于全国第二次土壤普查数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460974202880
 */
export const GUANGDONG_SOIL_DATASET_CSTR = '31253.11.sciencedb.460'
export const GUANGDONG_SOIL_SCIDB_DATASET_ID = '633694460974202880'

export const GUANGDONG_SOIL_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '633694460869345281',
    titleZh: '西藏土种志—基于第二次土壤普查数据集',
    titleEn: 'Soil Type Database of Tibet—Based on the Second National Soil Survey',
    keywordZh: ['西藏土壤', '土种志', '全国第二次土壤普查']
  },
  {
    datasetId: '748283818179297280',
    titleZh: '基于全国第二次土壤普查的四川重庆土种志数据集',
    titleEn: 'Soil type dataset of Sichuan based on the Second National Soil Survey',
    keywordZh: ['四川', '重庆', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: '633694460940648450',
    titleZh: '广西土种志——基于全国第二次土壤普查数据集',
    titleEn: 'Soil Species Database of Guangxi—based on the Second National Soil Survey',
    keywordZh: ['广西土壤', '土种志', '全国第二次土壤普查', '土壤调查']
  },
  {
    datasetId: 'e1ecfaac565b49dc95b649b763f71684',
    titleZh: '基于全国第二次土壤普查的新疆土种志数据集',
    titleEn: 'Soil species dataset of Xinjiang based on the Second National Soil Census',
    keywordZh: ['新疆', '土种', '第二次', '土壤普查']
  },
  {
    datasetId: 'b5129d6d03fa465c8424c7df1ad4b777',
    titleZh: '基于第二次全国土壤普查的青海土种志数据集',
    titleEn: 'Dataset of Qinghai soil species based on the second national soil Survey',
    keywordZh: ['青海', '土种', '第二次全国土壤普查']
  },
  {
    datasetId: '606c86cf41a74452b0723987d3aa238e',
    titleZh: '基于第二次全国土壤普查的辽宁土种志数据集',
    titleEn: 'A dataset of Liaoning soil species based on the Second National Soil Survey',
    keywordZh: ['辽宁土壤', '土种志', '第二次全国土壤普查']
  },
  {
    datasetId: '633694460877733888',
    titleZh: '中国土种数据库——基于第二次土壤普查的全国性土壤数据集',
    titleEn: 'Native database in China--based on the second national soil soil survey data sets',
    keywordZh: ['土壤', '土种数据库', '中国', '第二次全国土壤普查', '数据集成']
  },
  {
    datasetId: '187187cfda38490c899ca75a95df1872',
    titleZh: '内蒙古土种志数据集-基于全国第二次土壤普查的出版物',
    titleEn: 'Soil species dataset of Inner Mongolia based on the publications of the second National soil survey',
    keywordZh: ['内蒙古', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: 'caa0dbd38d03457ab9c9646f3a9e7683',
    titleZh: '基于高程变化及遥感影像的高亚洲地区跃动冰川数据集',
    titleEn:
      'A dataset of surge-type glaciers in the High Mountain Asia based on elevation change and satellite imagery',
    keywordZh: ['高亚洲', '跃动冰川', '光学遥感影像', '数字高程模型', 'DEM配准']
  },
  {
    datasetId: '633694461020340226',
    titleZh: '2009-2015广东低碳农业绩效水平测度数据集',
    titleEn: '2009-2015广东低碳农业绩效水平测度数据集',
    keywordZh: ['碳足迹', '碳排放强度', '绩效水平']
  }
]

/**
 * 广西土种志——基于全国第二次土壤普查数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460940648450
 */
export const GUANGXI_SOIL_DATASET_CSTR = '31253.11.sciencedb.385'
export const GUANGXI_SOIL_SCIDB_DATASET_ID = '633694460940648450'

export const GUANGXI_SOIL_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '748283818179297280',
    titleZh: '基于全国第二次土壤普查的四川重庆土种志数据集',
    titleEn: 'Soil type dataset of Sichuan based on the Second National Soil Survey',
    keywordZh: ['四川', '重庆', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: '633694460869345281',
    titleZh: '西藏土种志—基于第二次土壤普查数据集',
    titleEn: 'Soil Type Database of Tibet—Based on the Second National Soil Survey',
    keywordZh: ['西藏土壤', '土种志', '全国第二次土壤普查']
  },
  {
    datasetId: '633694460974202880',
    titleZh: '广东土种志——基于全国第二次土壤普查数据集',
    titleEn: 'Soil Species Database of Guangdong—based on the Second National Soil Survey',
    keywordZh: ['广东土壤', '土种志', '全国第二次土壤普查', '土壤调查']
  },
  {
    datasetId: 'e1ecfaac565b49dc95b649b763f71684',
    titleZh: '基于全国第二次土壤普查的新疆土种志数据集',
    titleEn: 'Soil species dataset of Xinjiang based on the Second National Soil Census',
    keywordZh: ['新疆', '土种', '第二次', '土壤普查']
  },
  {
    datasetId: 'b5129d6d03fa465c8424c7df1ad4b777',
    titleZh: '基于第二次全国土壤普查的青海土种志数据集',
    titleEn: 'Dataset of Qinghai soil species based on the second national soil Survey',
    keywordZh: ['青海', '土种', '第二次全国土壤普查']
  },
  {
    datasetId: '606c86cf41a74452b0723987d3aa238e',
    titleZh: '基于第二次全国土壤普查的辽宁土种志数据集',
    titleEn: 'A dataset of Liaoning soil species based on the Second National Soil Survey',
    keywordZh: ['辽宁土壤', '土种志', '第二次全国土壤普查']
  },
  {
    datasetId: '633694460877733888',
    titleZh: '中国土种数据库——基于第二次土壤普查的全国性土壤数据集',
    titleEn: 'Native database in China--based on the second national soil soil survey data sets',
    keywordZh: ['土壤', '土种数据库', '中国', '第二次全国土壤普查', '数据集成']
  },
  {
    datasetId: '187187cfda38490c899ca75a95df1872',
    titleZh: '内蒙古土种志数据集-基于全国第二次土壤普查的出版物',
    titleEn: 'Soil species dataset of Inner Mongolia based on the publications of the second National soil survey',
    keywordZh: ['内蒙古', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: 'aae3bb2cbe03429f8713699a5d9c98c5',
    titleZh: '新疆光伏电站和河北风电场2020–2021年土壤化学元素数据集',
    titleEn:
      'A dataset of soil chemical elements for the typical photovoltaic power plant in Xinjiang and wind farm in Hebei during 2020 – 2021',
    keywordZh: ['风电场', '光伏电站', '环境影响', '土壤', '化学元素']
  },
  {
    datasetId: '765528002485288960',
    titleZh: '1960~2017年中国大陆地区均一化的逐日观测地表土壤温度格点数据',
    titleEn:
      'Homogenized and gridded daily observed land soil temperature datasets over mainland China at 0.25°×0.25° from 1960 through 2017',
    keywordZh: ['日均观测', '均一化', '格点化', '土壤温度']
  }
]

/**
 * 2009-2015广东低碳农业绩效水平测度数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694461020340226
 */
export const GUANGDONG_LOWCARBON_AGRI_DATASET_CSTR = '31253.11.sciencedb.544'
export const GUANGDONG_LOWCARBON_AGRI_SCIDB_DATASET_ID = '633694461020340226'

export const GUANGDONG_LOWCARBON_AGRI_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'DS_a777a750dad74a19808e2accd28e253a',
    titleZh: '青冈县100m土壤有机碳分布数据集(2009年)',
    titleEn: '100m Soil Organic Carbon Distribution Dataset in Qinggang County (2009)',
    keywordZh: ['青冈县', '土壤有机碳分布', '2009年']
  },
  {
    datasetId: 'DS_da27013487b7496aa17ae37ed0740f53',
    titleZh: '东北地区农作物产量数据集（1949-2010年）',
    titleEn: 'Northeast Crop Yield Dataset (1949-2010)',
    keywordZh: ['东北地区', '农作物产量', '1949-2010年']
  },
  {
    datasetId: '51395e286dac49248fd6b6fc61ea825d',
    titleZh: '2005-2019陕西长武农田生态系统国家野外科学观测研究站气象数据集',
    titleEn: '2005-2019陕西长武农田生态系统国家野外科学观测研究站气象数据集',
    keywordZh: ['黄土高原沟壑区', '农田生态系统', '气候生产潜力', '气象观测', '长武站']
  },
  {
    datasetId: '633694461083254784',
    titleZh: '气候变化影响下1980–2014年中国西部干旱区生态碳库及碳源汇动态空间数据集',
    titleEn: '气候变化影响下1980–2014年中国西部干旱区生态碳库及碳源汇动态空间数据集',
    keywordZh: ['干旱', '碳库', 'AEM模型']
  },
  {
    datasetId: '8e88133c7afe4e158f1ceddfe68badec',
    titleZh: '基于生命周期的我国畜禽养殖业碳排放核算相关参数',
    titleEn: 'Lifecycle-based carbon emission accounting parameters for livestock and poultry industry in China',
    keywordZh: ['畜禽养殖业', '碳排放核算', '排放因子']
  },
  {
    datasetId: 'DS_9541e513c5ed49339d05505b2372384a',
    titleZh: '2010-2015年东北地区30 m分辨率农业开垦占用沼泽湿地空间数据集',
    titleEn: '2010-2015 Northeast China 30 meter resolution agricultural reclamation occupied swamp wetland spatial dataset',
    keywordZh: ['东北地区', '农业开垦占用沼泽湿地', '2010-2015年']
  },
  {
    datasetId: 'DS_eddb98b716b84795a278772663062182',
    titleZh: '2015年三江平原30m分辨率碳储量数据集',
    titleEn: '2015 Sanjiang Plain 30m resolution carbon stock data set',
    keywordZh: ['三江平原', '碳储量', '2015年']
  },
  {
    datasetId: '633694461313941507',
    titleZh: '1901–2014年黄土高原1 km分辨率月均温和月降水数据集',
    titleEn: '1901–2014年黄土高原1 km分辨率月均温和月降水数据集',
    keywordZh: ['黄土高原', '气温', '降水量', 'Delta降尺度']
  },
  {
    datasetId: '2057f12e2cd54c05b62f0b674af6703c',
    titleZh: '2000–2020年鄱阳湖干湿季边界数据集',
    titleEn: 'A dataset of the Poyang Lake coastlines in dry and wet seasons during 2000 – 2020',
    keywordZh: ['鄱阳湖', '干湿季', '面积变化']
  },
  {
    datasetId: '633694461158752258',
    titleZh: '海南省东方市地质旅游资源数据集',
    titleEn: 'A dataset of geological tourism resources in Dongfang city, Hainan province',
    keywordZh: ['东方市', '数据集', '地质旅游资源', '野外考察']
  }
]

/**
 * 大喉径临界流文丘里喷嘴几何参数与流出系数计算数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=bb9bd16f92414257a7a553ed3c411148
 */
export const VENTURI_NOZZLE_DATASET_CSTR = '31253.11.sciencedb.33407'
export const VENTURI_NOZZLE_SCIDB_DATASET_ID = 'bb9bd16f92414257a7a553ed3c411148'

export const VENTURI_NOZZLE_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'c1fd84fdd8b14e51b50bdce076b18e52',
    titleZh: '基于OpenMC与COBRA-EN耦合程序的VERA基准题Problem 6和Problem 7验证数据集',
    titleEn: 'Validation Dataset for VERA Benchmark Problems 6 and 7 Based on the OpenMC/COBRA-EN Coupled Code',
    keywordZh: ['OpenMC', 'VERA基准题', '物理热工耦合', '程序验证']
  },
  {
    datasetId: 'c3723b52039e4e0185317db05e95515e',
    titleZh:
      'Data for "Development and Benchmark Calculations of Monte Carlo Transport Program MATS for R&D of Accelerator-Driven System"',
    titleEn:
      'Data for "Development and Benchmark Calculations of Monte Carlo Transport Program MATS for R&D of Accelerator-Driven System"',
    keywordZh: [
      'accelerator-driven system',
      'Monte Carlo simulation',
      'code development',
      'benchmark calculations'
    ]
  },
  {
    datasetId: '949eda151bfe49eab5929fa5855fa4a8',
    titleZh: '真空储氢离子源中等离子体扩散机制的三维仿真研究',
    titleEn: '3D simulation study on plasma diffusion process in vacuum hydrogen ion source',
    keywordZh: ['真空离子源', '三流体模型', 'ZrD0.67', '粒子分离']
  },
  {
    datasetId: '9002a2748b6440b083f0a263a0f83f59',
    titleZh:
      'Dataset Title Water Vapor Dynamics in High-Vacuum Systems: Experimental Measurements and Numerical Simulations',
    titleEn:
      'Dataset Title Water Vapor Dynamics in High-Vacuum Systems: Experimental Measurements and Numerical Simulations',
    keywordZh: ['water vapor', 'vacuum system', 'adsorption model']
  },
  {
    datasetId: '3d3a55288136468d833ec21b46cf92e0',
    titleZh: 'Studies of Directed Flow with Event Plane Method in the HIRFL-CSR External-target Experiment',
    titleEn: 'Studies of Directed Flow with Event Plane Method in the HIRFL-CSR External-target Experiment',
    keywordZh: ['CEE experiment', 'directed flow (v₁)', 'event-plane method', 'ZDC', 'MWDC', 'TPC', 'JAM', 'CEEROOT']
  },
  {
    datasetId: '86578b82a276465792443f8e526df52f',
    titleZh: '一种求解Pál-Bell方程的方法：三维蒙特卡罗-半马尔可夫过程理论的计算数据',
    titleEn:
      'A method for solving the Pál-Bell equation: computational data from the theory of three-dimensional Monte Carlo and semi-Markov processes.',
    keywordZh: ['Pál-Bell方程', '蒙特卡罗', '广义半马尔可夫过程', '脉冲等待时间', 'NECP-MCX']
  },
  {
    datasetId: '24dec23da9d74b38b634f925b663504d',
    titleZh: '变二面角扩张管道角区分离的大涡模拟研究',
    titleEn: 'Large eddy simulations of corner separation in varying dihedral angle diffusers',
    keywordZh: ['二面角变化', '扩张管道', '流场数据']
  },
  {
    datasetId: '8a84361d8d274d3ab373cc6becb6062f',
    titleZh: 'Dataset of Magnetron Sputtered Coatings',
    titleEn: 'Dataset of Magnetron Sputtered Coatings',
    keywordZh: [
      'Magnetron sputtering',
      'Thin film coatings',
      'Deposition process parameters',
      'Coating properties'
    ]
  },
  {
    datasetId: 'a761eefb1ebe41a3968d83f9f2f10389',
    titleZh: '金沙江上游径流和河网流量再分析数据集',
    titleEn: 'Reanalysis datasets of runoff and river discharge for the Upper Jinsha river',
    keywordZh: ['金沙江', '径流', '河网', '长江源', '河流流量']
  },
  {
    datasetId: '96d563f6f3f84d05b9bb48e231c4ff41',
    titleZh:
      'Dataset from the measurement of cosmic-ray muons and muon-induced neutrons with a 28L gadolinium-doped liquid scintillator detector.',
    titleEn:
      'Dataset from the measurement of cosmic-ray muons and muon-induced neutrons with a 28L gadolinium-doped liquid scintillator detector.',
    keywordZh: ['Neutron detector', 'Cosmic ray', 'Muon flux']
  }
]

/**
 * 鄂尔多斯盆地东缘临兴区块上古生界致密砂岩显微图像集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=729774047423889408
 */
export const LINXING_SANDSTONE_DATASET_CSTR = '31253.11.sciencedb.00121'
export const LINXING_SANDSTONE_SCIDB_DATASET_ID = '729774047423889408'

export const LINXING_SANDSTONE_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '727601552654598144',
    titleZh: '鄂尔多斯盆地东缘临兴区块上古生界致密砂岩显微图像数据集',
    titleEn:
      'A photomicrograph dataset of Upper Paleozoic tight sandstone from Linxing block, eastern margin of Ordos Basin',
    keywordZh: ['岩石薄片', '致密砂岩', '临兴区块', '上古生界', '鄂尔多斯盆地']
  },
  {
    datasetId: '727528044247384064',
    titleZh: '鄂尔多斯盆地东北缘上古生界盒8段砂岩显微图像数据集',
    titleEn: 'A sandstone microscopical images dataset of He-8 Member of Upper Paleozoic in Northeast Ordos Basin',
    keywordZh: ['鄂尔多斯盆地', '上古生界', '盒8', '段', '砂岩', '显微图像']
  },
  {
    datasetId: '732989674569596928',
    titleZh: '鄂尔多斯盆地中寒武统徐庄组岩石薄片显微图像数据集',
    titleEn: 'A dataset of microscopic image of rock slices of Xuzhuang Formation in Ordos Basin',
    keywordZh: ['显微图集', '岩石薄片', '中寒武统徐庄组', '鄂尔多斯盆地']
  },
  {
    datasetId: '727100648432074752',
    titleZh: '塔西北与华南地区晚奥陶世碳酸盐岩（含生物碎屑） 显微图像数据集',
    titleEn: 'A micrograph dataset of late Ordovician carbonate rocks in Northwest Tarim and South China',
    keywordZh: ['上奥陶统', '塔西北地区', '中扬子地区', '碳酸盐岩', '生物碎屑']
  },
  {
    datasetId: '703351065692602368',
    titleZh: '中国西南地区二叠纪含火山岩屑砂岩的显微图像数据集',
    titleEn: 'A microscopic image dataset of Permian volcanolithic fragment bearing sandstones from southwest China',
    keywordZh: ['二叠纪', '火山岩屑砂岩', '西南地区', '显微图像', '数字化']
  },
  {
    datasetId: '724638692169220096',
    titleZh: '北拉萨地体白垩纪郎山组岩石薄片显微图像数据集',
    titleEn: 'A photomicrograph dataset of mid-Cretaceous Langshan Formation from the northern Lhasa Terrane, Tibet',
    keywordZh: ['郎山组', '碳酸盐岩', '岩石显微图像']
  },
  {
    datasetId: 'a9425c458f034ce78b3360f71c7877d4',
    titleZh: '川中地区中三叠统雷口坡组碳酸盐岩显微图像数据集',
    titleEn: 'Microscopic image data set of carbonate rocks of Leikoupo Formation of Middle Triassic in Central Sichuan',
    keywordZh: ['川中地区', '雷口坡组', '碳酸盐岩', '显微图像']
  },
  {
    datasetId: '731595076429414400',
    titleZh: '藏南日喀则弧前盆地白垩纪陆源碎屑岩显微图像集',
    titleEn: 'A photomicrograph dataset of Cretaceous siliciclastic rocks from Xigaze Forearc basin, southern Tibet',
    keywordZh: ['藏南', '日喀则弧前盆地', '白垩纪', '碎屑岩', '岩石薄片', '偏光显微图像']
  },
  {
    datasetId: '731491169510359040',
    titleZh: '鄂尔多斯盆地东北缘中侏罗世碎屑岩显微图像数据集',
    titleEn: 'A micrograph dataset of Middle Jurassic clastic rock in the northeastern Ordos Basin',
    keywordZh: ['地质数据', '图像数据', '信息化', '矿物学', '沉积学']
  },
  {
    datasetId: '727525043063488512',
    titleZh: '中扬子区中生代含变质岩屑砂岩的显微图像集',
    titleEn: 'A microscopic image dataset of Mesozoic metamorphic grains bearing sandstones from Mid-Yangtze, China',
    keywordZh: ['中生代', '变质岩屑砂岩', '中扬子区', '显微图像']
  }
]

/**
 * 基于人口学及临床特征的早产预测模型的研究
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=775841802602151936
 */
export const PRETERM_PREDICTION_DATASET_CSTR = '31253.11.sciencedb.00314'
export const PRETERM_PREDICTION_SCIDB_DATASET_ID = '775841802602151936'

export const PRETERM_PREDICTION_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'c8dfe53dda094acd9f9616fa88049875',
    titleZh: '深圳市 29 家医院 UU 管理情况调查统计',
    titleEn: 'Survey Statistics on UU Management in 29 Hospitals in Shenzhen City',
    keywordZh: ['早产儿', '尿解脲原体', '管理', '多中心', '调查']
  },
  {
    datasetId: '30215114447f49e5b296d8d6c1fe6e51',
    titleZh:
      'Development and validation of the nomogram to predict the infection risk of the pulmonary tuberculosis among people living with HIV',
    titleEn:
      'Development and validation of the nomogram to predict the infection risk of the pulmonary tuberculosis among people living with HIV',
    keywordZh: ['nomogram', 'hiv', 'tuberculosis']
  },
  {
    datasetId: 'OA_baf5c1d9e8c24604bbccc3fc37c31cc6',
    titleZh: '天津市40~75岁居民脑卒中高危人群特征及预测模型',
    titleEn: 'Characteristics and prediction model of high-risk population of stroke in 40~75 years old residents in Tianjin',
    keywordZh: ['脑卒中', '高危人群', '特征', '预测模型']
  },
  {
    datasetId: '0d70a1a7762e4831b939e73fc85b7d5c',
    titleZh: 'Maternal sleep and associated risk factors for premature birth',
    titleEn: 'Maternal sleep and associated risk factors for premature birth',
    keywordZh: ['Premature birth', 'Sleep', 'Risk factors']
  },
  {
    datasetId: 'OA_3b696778757b4c0484b4795e7288b235',
    titleZh: '影响早产儿超重/肥胖的孕期及围产期因素分析',
    titleEn: 'Analysis Of Pregnancy And Perinatal Factors Affecting Overweight/Obesity In Premature Infants',
    keywordZh: ['儿童超重/肥胖', '妊娠前肥胖', '新生儿旁氏指数', '早产']
  },
  {
    datasetId: '95966440b5f34fcd85fcfa15a4e72f98',
    titleZh:
      'The dataset of premature rupture of membranes (PROM) and necrotizing pneumonia in neonates from Wenzhou People’s Hospital from January 2015 to December 2021.',
    titleEn:
      'The dataset of premature rupture of membranes (PROM) and necrotizing pneumonia in neonates from Wenzhou People’s Hospital from January 2015 to December 2021.',
    keywordZh: ['PROM', 'necrotizing pneumonia', 'neonates']
  },
  {
    datasetId: 'c28db6b46cf64133a9167b44b1bfcfd6',
    titleZh: 'External Cephalic Version with breech presentation at term',
    titleEn: 'External Cephalic Version with breech presentation at term',
    keywordZh: ['external cephalic version', 'breech presentation', 'risk factor', 'prediction model']
  },
  {
    datasetId: 'e82f3177625c43579ea6c9df2e938165',
    titleZh:
      'Correlation and risk factors analysis of body composition during early pregnancy and gestational diabetes mellitus',
    titleEn:
      'Correlation and risk factors analysis of body composition during early pregnancy and gestational diabetes mellitus',
    keywordZh: [
      'early pregnancy',
      'body composition',
      'gestational diabetes mellitus',
      'correlation',
      'risk factors'
    ]
  },
  {
    datasetId: '766695112758525952',
    titleZh: 'Microsoft Concept Graph: Mining Semantic Concepts for Short Text Understanding',
    titleEn: 'Microsoft Concept Graph: Mining Semantic Concepts for Short Text Understanding',
    keywordZh: ['Knowledge extraction', ' Conceptualization', ' Text understanding']
  },
  {
    datasetId: '766325912500174848',
    titleZh: 'XLORE2: Large-Scale Cross-Lingual Knowledge Graph Construction and Application',
    titleEn: 'XLORE2: Large-Scale Cross-Lingual Knowledge Graph Construction and Application',
    keywordZh: [
      'Knowledge base completion',
      ' Knowledge linking',
      ' Property matching',
      ' Taxonomy alignment',
      ' Type inference',
      ' Entity linking'
    ]
  }
]

/**
 * 1989 ~ 2013年中国土壤样品库数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460777070592
 */
export const CHINA_SOIL_ARCHIVE_DATASET_CSTR = '31253.11.sciencedb.15'
export const CHINA_SOIL_ARCHIVE_SCIDB_DATASET_ID = '633694460777070592'

export const CHINA_SOIL_ARCHIVE_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'DS_5521cbc61e0e446a9451b66b52a39828',
    titleZh: '中国土壤资源-土种数据集(1990-1997年)',
    titleEn: 'Chinese Soil Resources Soil Species Dataset (1990-1997)',
    keywordZh: ['中国', '土壤资源-土种', '1990-1997年']
  },
  {
    datasetId: '187187cfda38490c899ca75a95df1872',
    titleZh: '内蒙古土种志数据集-基于全国第二次土壤普查的出版物',
    titleEn: 'Soil species dataset of Inner Mongolia based on the publications of the second National soil survey',
    keywordZh: ['内蒙古', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: '748283818179297280',
    titleZh: '基于全国第二次土壤普查的四川重庆土种志数据集',
    titleEn: 'Soil type dataset of Sichuan based on the Second National Soil Survey',
    keywordZh: ['四川', '重庆', '土种', '全国第二次土壤普查']
  },
  {
    datasetId: '633694460894511105',
    titleZh: '1995～2011年CERN土壤环境元素含量数据集',
    titleEn: 'Soil environment status dataset of China',
    keywordZh: ['土壤环境', '土壤污染', '重金属', '中国生态系统研究网络（CERN）', '长期定位监测']
  },
  {
    datasetId: '606c86cf41a74452b0723987d3aa238e',
    titleZh: '基于第二次全国土壤普查的辽宁土种志数据集',
    titleEn: 'A dataset of Liaoning soil species based on the Second National Soil Survey',
    keywordZh: ['辽宁土壤', '土种志', '第二次全国土壤普查']
  },
  {
    datasetId: '633694460877733888',
    titleZh: '中国土种数据库——基于第二次土壤普查的全国性土壤数据集',
    titleEn: 'Native database in China--based on the second national soil soil survey data sets',
    keywordZh: ['土壤', '土种数据库', '中国', '第二次全国土壤普查', '数据集成']
  },
  {
    datasetId: '633694460898705408',
    titleZh: '2005～2014年CERN野外台站气象观测场土壤含水量数据集',
    titleEn: 'A Soil Moisture Dataset Monitored by CERN during 2005-2014',
    keywordZh: ['陆地生态系统', '气象观测场', '土壤含水量', '中子仪', '台站', 'CERN']
  },
  {
    datasetId: '22d282356e5043969fb05e1bee202cec',
    titleZh: '2005-2017年中国干旱半干旱区典型生态系统土壤储水量数据集',
    titleEn: 'Soil water storage dataset of typical ecosystems in arid and semi-arid areas of China, 2005-2017',
    keywordZh: ['干旱半干旱区', '陆地生态系统', '气象观测场', '土壤储水量', '土壤含水量', 'CERN']
  },
  {
    datasetId: '633694461121003520',
    titleZh: '2016年中巴经济走廊冻土分布数据集',
    titleEn: '2016年中巴经济走廊冻土分布数据集',
    keywordZh: ['中巴经济走廊', '多年冻土分布', 'TTOP模型', 'MODIS地表温度']
  },
  {
    datasetId: '633694461095837697',
    titleZh: '2015～2017年中巴公路沿线山地冰川表面运动数据集',
    titleEn: 'Dataset of glacier surface motion along KKH during 2015-2017',
    keywordZh: ['中巴公路', '特征匹配方法', '冰川表面运动', 'Sentinel1A']
  }
]

/**
 * 西双版纳民间传统利用植物信息数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460751904769
 */
export const XISHUANGBANNA_PLANTS_DATASET_CSTR = '31253.11.sciencedb.7'
export const XISHUANGBANNA_PLANTS_SCIDB_DATASET_ID = '633694460751904769'

export const XISHUANGBANNA_PLANTS_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '7c9f2278721e410d8bf7bcbf0bf45c92',
    titleZh: '北京维管植物编目和分布数据集',
    titleEn: 'A dataset on inventory and geographical distributions of vascular plants in Beijing, China',
    keywordZh: ['北京', '维管植物', '编目', '外来植物', '植物多样性']
  },
  {
    datasetId: '633694460990980096',
    titleZh: '云南省种子植物名录数据集',
    titleEn: 'The dataset of seed plants catalogue in Yunnan Province',
    keywordZh: ['云南', '种子植物', '名录']
  },
  {
    datasetId: '798220974217494528',
    titleZh: '中国有用植物数据集',
    titleEn: 'A Scientific Dataset of useful plants of China',
    keywordZh: ['维管植物', '传统知识', '民族植物学']
  },
  {
    datasetId: '633694460995174402',
    titleZh: '缅甸植物多样性数据集',
    titleEn: 'Plant Biodiversity Data Set of Myanmar',
    keywordZh: ['缅甸', '植物多样性', '科学数据', '多源数据集成']
  },
  {
    datasetId: '613c1dae6e424c17803041d2386ffc03',
    titleZh: 'A dataset on inventory and geographical distribution of vascular plants in Xizang, China',
    titleEn: 'A dataset on inventory and geographical distribution of vascular plants in Xizang, China',
    keywordZh: ['Xizang', 'vascular plants', 'inventory', 'plant diversity', 'county distribution', 'dataset']
  },
  {
    datasetId: '76531e4cd63f44699c4d95bd6f1c5a5a',
    titleZh: '2011年新疆南疆重点调查湿地植物名录',
    titleEn: 'A dataset of plant lists from key surveyed wetlands in Southern Xinjiang in 2011',
    keywordZh: ['新疆南疆地区', '植物名录', '湿地植物', '植物多样性']
  },
  {
    datasetId: 'e70a55a42b1d4616926767710e716736',
    titleZh: '海南省野生维管植物编目和分布数据集',
    titleEn: 'A dataset on inventory and geographical distributions of wild vascular plants in Hainan Province, China',
    keywordZh: ['海南', '维管植物', '编目', '外来植物', '植物多样性']
  },
  {
    datasetId: '983ad5e5dc3f4a75a6432f9539ee34f5',
    titleZh: '中国外来植物名录数据集',
    titleEn: 'A dataset on catalogue of alien plants in China',
    keywordZh: ['外来植物', '栽培植物', '逃逸植物', '入侵植物', '植物多样性']
  },
  {
    datasetId: 'f126c4a1aa6f44559005d44fd4c29097',
    titleZh: 'The phylogenetic tree and the present-absent table of 5306 seed plants in 11 EA-ENA sites',
    titleEn: 'The phylogenetic tree and the present-absent table of 5306 seed plants in 11 EA-ENA sites',
    keywordZh: ['11 sites ', 'EA-ENA disjunctions', 'phylogenetic tree', 'present-absent table']
  },
  {
    datasetId: '3af4235a32534b699b17ba07b7a1d46a',
    titleZh: 'A dataset of L1 MBL simulation',
    titleEn: 'A dataset of L1 MBL simulation',
    keywordZh: ['L1', 'MD', 'enzymes', 'AMR']
  }
]

/**
 * Internet-scale active NAT detections for IoT Devices
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=776857038805270528
 */
export const IOT_NAT_DETECTION_DATASET_CSTR = '31253.11.sciencedb.00327'
export const IOT_NAT_DETECTION_SCIDB_DATASET_ID = '776857038805270528'

export const IOT_NAT_DETECTION_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '09ea1e86144f46f68850f1897a51285a',
    titleZh: 'Three typical internet workload traffic',
    titleEn: 'Three typical internet workload traffic',
    keywordZh: ['network', 'traffic workload', 'processed']
  },
  {
    datasetId: 'fe56d4b42aab4dc18ee87abc033dd9db',
    titleZh: 'WiFi 802.11b indoor and outdoor dataset',
    titleEn: 'WiFi 802.11b indoor and outdoor dataset',
    keywordZh: ['WiFi', '5days', 'indoor', 'outdoor', '50device']
  },
  {
    datasetId: '42158e4fdfce49d9a33e3e9ef42f5410',
    titleZh: '两个已标注的中文网络新闻数据集',
    titleEn: 'Two labeled network news datasets',
    keywordZh: ['网络新闻', '话题检测', '分组标签']
  },
  {
    datasetId: '3162c43f03de4ee6816c224260fb37ac',
    titleZh: '网络流量分类数据集',
    titleEn: 'Network traffic classification data set',
    keywordZh: ['网络流量', '异常流量', '异常检测']
  },
  {
    datasetId: '13eea14c4cd94d9c89bd4e4884ba7ad4',
    titleZh: 'Large-scale bacterial detection dataset',
    titleEn: 'Large-scale bacterial detection dataset',
    keywordZh: ['bacterial detection', 'large-scale', 'bacterial', 'detection']
  },
  {
    datasetId: '1bf00d7b605c49eeb8d406b4fcb4c941',
    titleZh: '层次化结构的名字解析系统中进行映射记录注册时所用的数据集',
    titleEn:
      'The dataset used in the registration of mapping records in hierarchically structured name resolution systems',
    keywordZh: ['网络数据包', '名字', 'ip地址']
  },
  {
    datasetId: 'cb6b08a3036b4777812f0444043c37c3',
    titleZh: '面向试验鉴定的命名实体识别任务数据集',
    titleEn: 'Named entity recognition task data set for Test and Evaluation domain',
    keywordZh: ['命名实体识别', '评测任务', '试验鉴定领域']
  },
  {
    datasetId: '007a0580cbcb437bbb2e85b0b4f1c128',
    titleZh:
      'Datasets Release: An IEEE 802.11 a/g (WiFi) massive-scale and labeled datasets for Radio Fingerprinting',
    titleEn:
      'Datasets Release: An IEEE 802.11 a/g (WiFi) massive-scale and labeled datasets for Radio Fingerprinting',
    keywordZh: [
      'wifi signal (I/Q)',
      '20 USRP',
      'differ antenna',
      'RF fingerprint',
      'multi-class classification',
      'transmitter identification'
    ]
  },
  {
    datasetId: '6e140ffd9f8544d8a54592ed70ffe102',
    titleZh: '格陵兰冰盖高程变化数据集',
    titleEn: 'An elevation change dataset in Greenland ice sheet from 2003 to 2020 using satellite altimetry data',
    keywordZh: ['格陵兰冰盖', '高程变化', '卫星测高']
  },
  {
    datasetId: '3a6105457dc946a8b6e0040ff0794d27',
    titleZh: '2020年京津冀1km格网农村道路密度数据集',
    titleEn: 'A dataset of 1km Grid country road density in Beijing-Tianjin-Hebei (2020）',
    keywordZh: ['农村道路', '国土调查', '格网', '京津冀']
  }
]

/**
 * AI参与决策对趋避行为意向的影响：公平感知和信任感知的中介作用
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=6717c42216ff49f890997380190cf7df
 */
export const AI_DECISION_BEHAVIOR_DATASET_CSTR = '31253.11.sciencedb.25507'
export const AI_DECISION_BEHAVIOR_SCIDB_DATASET_ID = '6717c42216ff49f890997380190cf7df'

export const AI_DECISION_BEHAVIOR_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '5c9b160636f34c3a9259e48ff31a5a0b',
    titleZh: '职场AI化的行为代价：AI参与决策对员工趋避行为意向的影响——补充材料',
    titleEn:
      'The Behavioral Consequences of Workplace AI Integration: The Impact of AI Involvement in Decision-Making on Employee Approach-Avoidance Behavioral Intentions——Supplementary Materials',
    keywordZh: ['公平感知', '信任感知', '趋避行为意向', 'AI参与']
  },
  {
    datasetId: '8f070029d86b4f5cac7f6e14835f4dc9',
    titleZh: 'The influence of perceived fairness on trust in human-computer interaction',
    titleEn: 'The influence of perceived fairness on trust in human-computer interaction',
    keywordZh: ['fairness perception', 'trust', 'decision-making behaviors']
  },
  {
    datasetId: '4025962294274f9490f4070ad89d5b65',
    titleZh: '价值对齐效应在人-AI互动与人际互动中的差异：决策情境类型的调节作用',
    titleEn: 'Value Alignment Effect in Human-AI vs. Interpersonal Interaction: The Moderating Role of Decision Context',
    keywordZh: ['价值对齐', '人机互动', '事实判断', '价值判断', '信任']
  },
  {
    datasetId: 'a5e705ca6eee4dbcb9c54a6b410832dc',
    titleZh: '价值对齐效应在人-AI互动与人际互动中的差异：决策情境类型的调节作用',
    titleEn: 'Value Alignment Effect in Human-AI vs. Interpersonal Interaction: The Moderating Role of Decision Context',
    keywordZh: ['价值对齐', '人机互动', '事实判断', '价值判断', '信任']
  },
  {
    datasetId: 'b040cfdf44bf4ad6828dd2e2861592ee',
    titleZh: '任务结果和评价主体对人机协作责任归因的影响',
    titleEn: 'How task outcomes and evaluation targets influence  responsibility attribution in human-AI collaboration',
    keywordZh: ['人机协作', '任务结果', '评价主体', '责任归因']
  },
  {
    datasetId: 'efa5a8f63f3844c2bb510d1980515487',
    titleZh:
      'Data and Code for "Is Transparency a Panacea for AI? The Impact of Transparency in Rationale and Process on Perceived Legitimacy in AI-assisted Decision Making"',
    titleEn:
      'Data and Code for "Is Transparency a Panacea for AI? The Impact of Transparency in Rationale and Process on Perceived Legitimacy in AI-assisted Decision Making"',
    keywordZh: ['transparency', 'artificial intelligence', 'experiment']
  },
  {
    datasetId: '7662fa579bcc4195bcbf54c8b9fa02e5',
    titleZh: '生成式人工智能风险提示与用户采纳的实验数据集',
    titleEn: 'Experimental Dataset on Generative AI Risk disclosure and User Adoption',
    keywordZh: ['生成式人工智能风险提示', '用户采纳', '准确性风险', '能力信任', '不确定性规避', '可解释性']
  },
  {
    datasetId: 'ba3bcedad92347d98c94d0fd2a5948aa',
    titleZh: 'AI信任量表',
    titleEn: 'Artificial Intelligence Trust Scale',
    keywordZh: ['AI信任', '正直信任', '性能信任', '量表', '信任维度']
  },
  {
    datasetId: '2367c4cc7ac54f5c82cdcfa5abd9448a',
    titleZh: '感知有用性与自我效能感对AI学习工具依赖的双路径影响问卷研究',
    titleEn:
      'A Questionnaire Study on the Dual-Path Impact of Perceived Usefulness and Self-Efficacy on the Dependence on AI Learning Tools',
    keywordZh: ['AI学习工具', '感知有用性', '自我效能感', '工具依赖', '双路径模型']
  },
  {
    datasetId: 'e07ed89e94bc471fb22e06372a66ee18',
    titleZh: '人智决策让渡概念构建',
    titleEn: 'Decision Delegation Behavior Dataset',
    keywordZh: ['决策让渡', '人智协作', '权力距离']
  }
]

/**
 * 长江口06号大型综合观测浮标2014-2015年观测数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460839985154
 */
export const YANGTZE_ESTUARY_BUOY_DATASET_CSTR = '31253.11.sciencedb.47'
export const YANGTZE_ESTUARY_BUOY_SCIDB_DATASET_ID = '633694460839985154'

export const YANGTZE_ESTUARY_BUOY_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '720626421151563776',
    titleZh: '2010–2018年黄海、东海海域台风数据集',
    titleEn: 'A typhoon dataset of the Yellow Sea and East China Sea from 2010 to 2018',
    keywordZh: ['台风', '观测数据', '黄海', '东海', '长期实测']
  },
  {
    datasetId: 'c19ddab1cbcf4142bd142e4759b1cca4',
    titleZh: '2017-2023年海水水质监测信息数据集',
    titleEn: 'Data set of seawater quality monitoring information 2017-2023',
    keywordZh: ['海水', '水质', '监测', '数据']
  },
  {
    datasetId: '633694460873539584',
    titleZh: '中国近海观测网络黄海站01号浮标2013～2015年观测数据集',
    titleEn:
      'Observation Data of No.1 Buoy of the Yellow Sea station in 2013~2015, Off-shore Marine Observation and Research Network of China',
    keywordZh: ['黄海', '浮标', '数据集', '气象', '水文', '水质']
  },
  {
    datasetId: 'f9cf0246a06a4fba9572c5ac9c109530',
    titleZh: '2021–2023年秦皇岛近海23号浮标温盐观测日均值数据集',
    titleEn: 'A daily average dataset of temperature and salinity based on No. 23 buoy Qinhuangdao offshore during 2021–2023',
    keywordZh: ['渤海海域', '锚定浮标', '综合观测系统', '温盐数据']
  },
  {
    datasetId: '720632528666361856',
    titleZh: '2014–2015年东海站06号浮标温盐深剖面观测数据集',
    titleEn:
      'A dataset of temperature, salinity and depth profile of sea water based on No.6 Buoy of the East China Observation Station during 2014–2015',
    keywordZh: ['温盐深', '剖面观测', '东海', '浮标', '观测数据集']
  },
  {
    datasetId: '633694461360078849',
    titleZh: '2006-2010年胶州湾水体物理和化学环境因子监测数据集',
    titleEn: 'Physical and chemical monitoring dataset of pelagic environment in JiaozhouBay during 2006-2010',
    keywordZh: ['胶州湾', '水体环境', '生态系统', '长期监测']
  },
  {
    datasetId: '36f2c3343518473d9ab416371809d8bd',
    titleZh: 'Sensor data',
    titleEn: 'Sensor data',
    keywordZh: ['Conductivity', 'Temperature', 'Pressure', 'Hydrological data']
  },
  {
    datasetId: '06bacffe2cde4eecb19e8e1882100ba9',
    titleZh:
      'Long-term hindcast for temperature, salinity and dissovled oxygen at the 31°N transect off the Changjiang estuary',
    titleEn:
      'Long-term hindcast for temperature, salinity and dissovled oxygen at the 31°N transect off the Changjiang estuary',
    keywordZh: ['Physical Oceanography', 'biogeochemistry', 'ocean modeling', 'dissovled oxygen', 'Changjiang estuary']
  },
  {
    datasetId: '720632528569892864',
    titleZh: '2018–2019年东海站三锚式浮标综合观测平台剖面观测数据集',
    titleEn:
      'A dataset of profile observation on three-anchor buoy integrated observation platform of the East China Observation station in 2018–2019',
    keywordZh: ['东海', '三锚式', '浮标观测', '剖面观测']
  },
  {
    datasetId: '633694461246832640',
    titleZh: '1970–2017年海南岛Landsat系列卫星遥感深加工数据集',
    titleEn: 'Value-added Landsat image data of Hainan Island from 1970 to 2017',
    keywordZh: ['Landsat', '海南岛', '深加工产品', '波段融合', '遥感服务']
  }
]

/**
 * 亚热带区域稻田长期施肥定位试验2024年度土壤养分数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=7df4ef22aa924fbd836997062e4a4af3
 */
export const SUBTROPICAL_PADDY_SOIL_DATASET_CSTR = '31253.11.sciencedb.j00001.01682'
export const SUBTROPICAL_PADDY_SOIL_SCIDB_DATASET_ID = '7df4ef22aa924fbd836997062e4a4af3'

export const SUBTROPICAL_PADDY_SOIL_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'da1619fd2b9c4e17b3636659dde5d34e',
    titleZh: '1998-2022年千烟洲土壤养分数据集',
    titleEn: 'Long-term observation dataset of soil nutrient in Qianyanzhou (1998–2022)',
    keywordZh: ['土壤养分', '水稻', '耕作方式', '秸秆还田', '长时间尺度']
  },
  {
    datasetId: '31a4d5c833204a90a41bef098c57add6',
    titleZh: '2020年不同施肥措施下六合小麦-甘薯轮作农田土壤理化性质、磷组分及磷活化微生物群落数据集',
    titleEn:
      'A Dataset of soil physical and chemical properties, phosphorus fractions, and phosphorus-activating microbial communities in wheat-sweet potato rotation fields in Liu District under differentization treatments in 2020',
    keywordZh: ['小麦-甘薯轮作', '施肥措施', '土壤磷组分', '磷活化', '微生物群落']
  },
  {
    datasetId: 'e5990e197acc4f2dbdc1f95f67b35e50',
    titleZh: '黄土高原区长期氮肥管理试验2013—2021年土壤表层含水量及温度数据集',
    titleEn:
      'Dataset of Topsoil Moisture and Temperature from 2013 to 2021 in the Long-Term Nitrogen Fertilizer Management Experiment in the Loess Plateau Region',
    keywordZh: ['黄土高原区', '氮肥管理模式', '土壤含水量', '地表及土层温度', '2013—2021年']
  },
  {
    datasetId: 'f4ff487db51042a1a15fd3bd7f1a9086',
    titleZh: '2017-2020年黄土旱塬长期氮肥管理试验玉米产量、土壤水分及硝态氮数据集',
    titleEn:
      'Dataset of Maize Yield, Soil Moisture, and Nitrate Nitrogen in the Long-Term Nitrogen Fertilizer Management on the Loess Plateau (2017-2020)',
    keywordZh: ['黄土旱塬', '春玉米', '产量', '氮素管理']
  },
  {
    datasetId: '2ea8c3b239b74b43a3cf750b207d061f',
    titleZh: '2020-2022年度祁阳站长期施肥定位试验红壤温度动态数据集',
    titleEn: 'A dataset of red soil temperature dynamic from the long-term fertilization experiment at Qiyang Station from 2020 to 2022',
    keywordZh: ['长期定位试验', '有机肥', '秸秆还田', '红壤旱地土壤温度', '气象数据']
  },
  {
    datasetId: '7a97e75e6256485c9c3276f29071f390',
    titleZh: '黄土高原不同施肥下2023-2024年度土壤水热盐动态观测数据集',
    titleEn:
      'Observation dataset of soil water, heat and salt dynamics in the Loess Plateau under different fertilization conditions in the 2023-2024 period',
    keywordZh: ['黄土高原', '土壤水分', '土壤温度', '土壤电导']
  },
  {
    datasetId: '92e4f48030d643aaa9aec83bfcf57eb2',
    titleZh: 'A dataset from a long-term fertilization experiment in alpine meadows on the Qinghai-Tibet Plateau.',
    titleEn: 'A dataset from a long-term fertilization experiment in alpine meadows on the Qinghai-Tibet Plateau.',
    keywordZh: ['alpine meadow', 'nutrient addition', 'nutrient cessation']
  },
  {
    datasetId: '8b2fc499e76840d0becc73bdb5e799d5',
    titleZh: '长期施肥下红壤温湿度及电导率2023年度观测数据集',
    titleEn: 'Observation dataset of temperature, humidity and electrical conductivity of red soil under long-term fertilization in 2023',
    keywordZh: ['红壤旱地', '土壤水分', '土壤温度', '土壤电导率']
  },
  {
    datasetId: 'f44cc422d201483b9aba54a9583a8204',
    titleZh: '红壤区双季稻田长期施肥定位试验水稻品质数据集',
    titleEn:
      'A dataset of rice quality traits from the long-term fertilization positioning experiment in double-cropping rice fields of the red soil region',
    keywordZh: ['红壤区', '长期施肥', '蒸煮品质', '营养品质', '外观品质', '加工品质']
  },
  {
    datasetId: 'ca26ab1ff97e4f119962f090eb2aed63',
    titleZh: '2000-2025年施肥调控中国农田土壤微生物特性的田间试验数据集',
    titleEn:
      'Field experiment data set of soil microbial characteristics in responses to fertilizer regulation in different farmlands of China from 2000 to 2025',
    keywordZh: ['中国农田', '施肥', '土壤微生物', '田间试验', '数据整合']
  }
]

/**
 * A dataset Of Bladder Cancer
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=cb7ca637a2dd4947842e2a630c8a9011
 */
export const BLADDER_CANCER_DATASET_CSTR = '31253.11.sciencedb.31230'
export const BLADDER_CANCER_SCIDB_DATASET_ID = 'cb7ca637a2dd4947842e2a630c8a9011'

export const BLADDER_CANCER_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: '28199b8945de46c29053412a8060d971',
    titleZh: 'Database of Tumor Early-Screening Based on Liquid Biopsy (DTS-LB)',
    titleEn: 'Database of Tumor Early-Screening Based on Liquid Biopsy (DTS-LB)',
    keywordZh: ['Colorectal Cancer', 'Microbiota', 'Database', 'Early Diagnosis', 'Systems Biology']
  },
  {
    datasetId: 'f4fb82cc908a4d47b3ecbdcd1ce89364',
    titleZh: 'Database of Tumor Early-Screening Based on Microbiome (DTS-MB)',
    titleEn: 'Database of Tumor Early-Screening Based on Microbiome (DTS-MB)',
    keywordZh: ['Colorectal Cancer', 'Microbiota', 'Database', 'Early Diagnosis', 'Systems Biology']
  },
  {
    datasetId: '890a466d647b4d458fa5e1ae6add9990',
    titleZh:
      'Urine IRF4/PENK/PXDN Methylation Signatures Enable Machine Learning-Driven Bladder Cancer Detection and Microenvironment Dissection',
    titleEn:
      'Urine IRF4/PENK/PXDN Methylation Signatures Enable Machine Learning-Driven Bladder Cancer Detection and Microenvironment Dissection',
    keywordZh: ['bladder cancer', 'clinical information', 'primer']
  },
  {
    datasetId: 'ff268161d7ff4d7cb6c468658d044f9d',
    titleZh: 'Detection of bacteria-residing circulating tumor cells (CTCs) using DARMR',
    titleEn: 'Detection of bacteria-residing circulating tumor cells (CTCs) using DARMR',
    keywordZh: ['peripheral blood', 'CTC', 'bacteria']
  },
  {
    datasetId: 'cd3c0398adab414f98c165291f95cdfc',
    titleZh: 'Data acquisition',
    titleEn: 'Data acquisition',
    keywordZh: [
      'Breast carcinogenesis',
      'Methyl 4-hydroxybenzoate',
      'Fibroblasts',
      'Network toxicology',
      'Biomarkers'
    ]
  },
  {
    datasetId: '06a8ee0179c945cba513d2953a96da39',
    titleZh: 'Ovarian Cancer Biomarker Database (OCBD)',
    titleEn: 'Ovarian Cancer Biomarker Database (OCBD)',
    keywordZh: ['Ovarian cancer', 'diagnosis', 'biomarker']
  },
  {
    datasetId: '92bde77ff0dd40b8b6f77c28a61ba2d8',
    titleZh: 'Clinical Biochemical Test Data for Early-Stage Colon Adenocarcinoma (COAD) Patients',
    titleEn: 'Clinical Biochemical Test Data for Early-Stage Colon Adenocarcinoma (COAD) Patients',
    keywordZh: ['COAD', 'ML', 'Clinical Biochemical Testing']
  },
  {
    datasetId: '658e231d95c54479ad7ff2218c3811ef',
    titleZh:
      'STUDY: Integrated Transcriptomic and Metabolic Profiling Reveals a Robust Early Detection Biomarker Signature in Early-Stage Gastric Cancer',
    titleEn:
      'STUDY: Integrated Transcriptomic and Metabolic Profiling Reveals a Robust Early Detection Biomarker Signature in Early-Stage Gastric Cancer',
    keywordZh: ['Gastric cancer', 'Metabolomics', 'Biological markers']
  },
  {
    datasetId: '77c58fb8e2d24336b3ff919417ae7fe4',
    titleZh: 'Cholangiocarcinoma Biomarker Database（CBD）',
    titleEn: 'Cholangiocarcinoma Biomarker Database（CBD）',
    keywordZh: ['Cholangiocarcinoma', 'research resources', 'biomarkers']
  },
  {
    datasetId: '4c6a2298782a4830811185d79826e766',
    titleZh: '胃癌组织单细胞测序数据集',
    titleEn: 'Gastric Cancer Tissue Single-Cell Sequencing Dataset',
    keywordZh: ['胃癌', '单细胞测序', '抗血管生成联合治疗']
  }
]

/**
 * 中国科技期刊编辑出版相关国家标准和行业标准数据集
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=aa19d7f0c9c24ad1bbbd3c84db622479
 */
export const JOURNAL_STANDARDS_DATASET_CSTR = '31253.11.sciencedb.19693'
export const JOURNAL_STANDARDS_SCIDB_DATASET_ID = 'aa19d7f0c9c24ad1bbbd3c84db622479'

export const JOURNAL_STANDARDS_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'ac19ae7cc21d4151ae5002eeb9ed2347',
    titleZh: '中国科学院推动数据开放的政策与实践',
    titleEn: 'Policies and Practice of the Chinese Academy of Sciences in Promoting Open Data',
    keywordZh: ['数据开放', '政策', '科学数据管理与开放共享办法']
  },
  {
    datasetId: 'a6ff6e42862e49ac8c9f89b73a09c624',
    titleZh: 'Open data policy and practice at Springer Nature',
    titleEn: 'Open data policy and practice at Springer Nature',
    keywordZh: ['open data policy', 'open science', 'publishing']
  },
  {
    datasetId: 'c45b57e686a94552b4c5b525c3429b77',
    titleZh: '中国科技期刊卓越行动计划入选期刊数据政策实施现状调研与分析',
    titleEn:
      "Survey and Analysis of the Data Policy of China’s STM journals that Selected  by Excellence Action Plan for China's STM Journals Program for Example",
    keywordZh: ['数据共享', '数据政策', '数据出版', '中国科技期刊卓越行动计划']
  },
  {
    datasetId: 'cf75bbfe130641bfbd2f73214773c517',
    titleZh: 'Practice and Exploration Progress of Data Journals',
    titleEn: 'Practice and Exploration Progress of Data Journals',
    keywordZh: ['Open Science', 'PID', 'Infrastructure']
  },
  {
    datasetId: '432e98b842fb40c69bc0d3d246376ac9',
    titleZh: '中国开放数据白皮书 2023',
    titleEn: 'China State of Open Data Report 2023',
    keywordZh: ['开放数据', '数据政策', '数据期刊', '数据中心']
  },
  {
    datasetId: 'a8167dc744544b1da8f0d54703bb3b5c',
    titleZh: '我国农业科学数据开放共享实践与进展',
    titleEn: 'Practice and Progress of Open Sharing of Agricultural Science Data in China',
    keywordZh: ['农业资源', '科学数据共享', '农业科学数据中心']
  },
  {
    datasetId: '49ffb1764be441a1bc6e10cc7ea7030c',
    titleZh: '2023年中国开放数据白皮书要点',
    titleEn: "Key takeaways of China’s State of Open Data 2023",
    keywordZh: ['开放数据', '科学数据管理', '数据共享']
  },
  {
    datasetId: '76fb3e5a0e26451dbfd26eff17359411',
    titleZh: '我国科技期刊的论文关联数据政策制定思路与实践路径建议',
    titleEn:
      'Suggestions on policy formulation and practice path of paper related data for Chinese sci-tech journals',
    keywordZh: ['科学数据', '数据政策', '科学数据管理', '数据存储库', '开放科学']
  },
  {
    datasetId: 'bc487d278b0244ab887ffc98d7e5f12b',
    titleZh: 'The State of Open Data 2023',
    titleEn: 'The State of Open Data 2023',
    keywordZh: ['open data', 'publication', 'Data sharing']
  },
  {
    datasetId: 'd147b016eb2f48f68bd4ec036f837703',
    titleZh: '科学数据银行建设理念与实践',
    titleEn: 'Construction idea and practice of Science Data Bank',
    keywordZh: ['科学数据银行', '科学数据出版', '开放科学', '科学数据']
  }
]

/**
 * 2015年科学研究数据共享现状调查
 * GET /api/gin-sdb-recommend/public/recommend?datasetId=633694460928065536
 */
export const SCI_DATA_SHARING_2015_DATASET_CSTR = '31253.11.sciencedb.372'
export const SCI_DATA_SHARING_2015_SCIDB_DATASET_ID = '633694460928065536'

export const SCI_DATA_SHARING_2015_RELATED_DATASETS: RelatedDatasetItem[] = [
  {
    datasetId: 'd5b8ea1f5ba74c359f534fc0c01591a8',
    titleZh: '中国对地观测科学数据开放共享的现状和趋势',
    titleEn: 'Current status of open Earth observation scientific data in China',
    keywordZh: ['对地观测数据集', '科学数据', '科学数据共享']
  },
  {
    datasetId: 'c45b57e686a94552b4c5b525c3429b77',
    titleZh: '中国科技期刊卓越行动计划入选期刊数据政策实施现状调研与分析',
    titleEn:
      "Survey and Analysis of the Data Policy of China’s STM journals that Selected  by Excellence Action Plan for China's STM Journals Program for Example",
    keywordZh: ['数据共享', '数据政策', '数据出版', '中国科技期刊卓越行动计划']
  },
  {
    datasetId: '3ca7539a82434f129d4eff9daec2492a',
    titleZh: '科学数据开放共享服务现状及实现路径影响因素调查与分析',
    titleEn:
      'Investigation and analysis on the status quo of scientific data open sharing service and the influencing factors of its implementation path',
    keywordZh: ['科学数据', '开放共享', '服务', '影响因素', '调查统计']
  },
  {
    datasetId: '633694460873539588',
    titleZh: '科学数据出版调查',
    titleEn: 'Scientific data publishing survey',
    keywordZh: ['科学数据出版', '科学数据', '调查统计']
  },
  {
    datasetId: '432e98b842fb40c69bc0d3d246376ac9',
    titleZh: '中国开放数据白皮书 2023',
    titleEn: 'China State of Open Data Report 2023',
    keywordZh: ['开放数据', '数据政策', '数据期刊', '数据中心']
  },
  {
    datasetId: 'd0a8ea1568f14657a2b809be8e697080',
    titleZh: '中国数据期刊案例统计数据集',
    titleEn: 'Statistics on two Chinese Data Journals',
    keywordZh: ['开放数据', '数据论文', '数据出版', '数据重用', '数据引用', '引用计量']
  },
  {
    datasetId: '49ffb1764be441a1bc6e10cc7ea7030c',
    titleZh: '2023年中国开放数据白皮书要点',
    titleEn: "Key takeaways of China’s State of Open Data 2023",
    keywordZh: ['开放数据', '科学数据管理', '数据共享']
  },
  {
    datasetId: 'b2f699cc4f11420ab228c8cd873f8393',
    titleZh: '科学数据出版与开放共享',
    titleEn: 'Scientific data publishing and sharing',
    keywordZh: ['科学数据', '科学数据出版', '科学数据出版平台']
  },
  {
    datasetId: '1a49c4e2a58c443095d38ca60a7f023a',
    titleZh: '中国1km分辨率生物气候要素空间分布数据集',
    titleEn: 'A dataset of spatial distribution of bioclimatic variables in China at 1km resolution',
    keywordZh: ['生物气候要素', '气候变化', '植被分区', '气候数据集', '物种模拟']
  },
  {
    datasetId: '633694460928065537',
    titleZh: '基于MODIS MOD09Q1的青海、西藏湖泊水面数据集（2000~2012）',
    titleEn: 'MODIS MOD09Q1 derived lake water surface dataset of the Qinghai-Tibet Plateau (2000 – 2012)',
    keywordZh: ['湖泊水面', 'MOD09Q1', '青藏高原', '遥感']
  }
]

/**
 * 雅鲁藏布江流域松散沉积物类型及其厚度标定图集（2020）
 * POST https://data.tpdc.ac.cn/view/metadataView/detail/ { metadataId: d5c5116e-4386-4470-9065-3a5dc8687522 }
 * relatedDataList
 */
export const YARLUNG_TPDC_DATASET_CSTR = '18406.11.SolidEar.tpdc.272508'
export const YARLUNG_TPDC_DATASET_ID = '6a338daf1771000054002c04'
export const YARLUNG_TPDC_METADATA_ID = 'd5c5116e-4386-4470-9065-3a5dc8687522'

const YARLUNG_TPDC_RELATED_DATASETS_RAW: RelatedDatasetItem[] = [
  {
    datasetId: '5d33db8a-373c-4cfa-8dc7-dc92ebf6d5c4',
    titleZh: '祁连山综合观测网：祁连山植物多样性监测（植物调查数据-2018年）',
    titleEn:
      'Qilian Mountain comprehensive observation network: Plant diversity monitoring in Qilian Mountain (plant survey data - 2018)',
    keywordZh: []
  },
  {
    datasetId: 'b117d43c-b826-4efc-a639-62ea334924df',
    titleZh: '祁连山地区基于MODIS的逐日地表蒸散发数据（2018)（ETHi-merge V1）',
    titleEn:
      'Daily MODIS-based land surface evapotranspiration dataset in Qilian Mountain Area (ETHi-merge V1) (2018)',
    keywordZh: []
  },
  {
    datasetId: '3ba144a8-23c8-4b3a-93e3-d335c0b75bbc',
    titleZh: '祁连山重点区域土地覆盖/利用数据集（2018）',
    titleEn: 'The land cover/use data in key areas of the Qilian Mountain (2018)',
    keywordZh: []
  },
  {
    datasetId: '9ecef56a-7fa6-4883-b6a8-9b79f72d10f4',
    titleZh:
      '祁连山综合观测网：黑河流域地表过程综合观测网（四道桥超级站物候相机观测数据集-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (phenology camera observation dataset of Sidaoqiao superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: '4cc6a508-29f9-4560-93e9-0982618d4c01',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（四道桥叶面积指数-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (leaf area index of Sidaoqiao, 2018)',
    keywordZh: []
  },
  {
    datasetId: '7d9442b0-8dfd-412c-af9b-8b62c77eaa38',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（大满超级站叶面积指数-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (Leaf area index of Daman Superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: '44007ddd-e898-447c-a84b-801d400b5119',
    titleZh: '祁连山地区水体指数产品（2018）',
    titleEn: 'Water index in the Qilian Mountain Area in 2018 ',
    keywordZh: []
  },
  {
    datasetId: '407b798b-7b59-4c8f-818b-b07e335bea8f',
    titleZh:
      '祁连山综合观测网：黑河流域地表过程综合观测网（混合林站物候相机观测数据集-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (phenology camera observation data set of mixed forest superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'e1f562c3-5cf9-443f-89f3-0353962b0c60',
    titleZh:
      '祁连山综合观测网：黑河流域地表过程综合观测网（四道桥超级站气象要素梯度观测系统-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (an observation system of meteorological elements gradient of Sidaoqiao superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: '3bb0a20c-4f01-4a96-8c28-839db0ef904a',
    titleZh: '祁连山地区30m ASTER-GDEM数据集（2018）',
    titleEn: '30m aster-gdem data  in Qilian Mountain Area (2018)',
    keywordZh: []
  }
]

export const YARLUNG_TPDC_RELATED_DATASETS: RelatedDatasetItem[] =
  YARLUNG_TPDC_RELATED_DATASETS_RAW.map((item) => ({
    ...item,
    url: tpdcDatasetDetailUrl(item.datasetId)
  }))

/**
 * 基于冻结数模型的多情景多模型青藏高原多年冻土分布数据集（1950-2099）
 * POST https://data.tpdc.ac.cn/view/metadataView/detail/ { metadataId: 72c53b05-7845-4e50-b0cb-9f81990b64a3 }
 * relatedDataList
 */
export const PERMAFROST_TPDC_DATASET_CSTR = '18406.11.Cryos.tpdc.300535'
export const PERMAFROST_TPDC_DATASET_ID = '6a3397771771000054002c06'
export const PERMAFROST_TPDC_METADATA_ID = '72c53b05-7845-4e50-b0cb-9f81990b64a3'

const PERMAFROST_TPDC_RELATED_DATASETS_RAW: RelatedDatasetItem[] = [
  {
    datasetId: 'b9d8faa4-619c-4737-b6fb-3dbc496103ea',
    titleZh: '祁连山地区日值0.05°×0.05°地表土壤水分数据（2017, SMHiRes, V1）',
    titleEn:
      'Daily 0.05°×0.05° land surface soil moisture dataset of Qilian Mountain area (2017, SMHiRes, V1)',
    keywordZh: []
  },
  {
    datasetId: 'b41802cb-1129-4ef8-9c07-a2574b732fd8',
    titleZh: '祁连山地区冰川边界（2018）',
    titleEn: 'The glacier inventory of Qilian Mountain Area (2018 )',
    keywordZh: []
  },
  {
    datasetId: 'd75b3089-256e-4ebf-a0ed-de73d6b06d10',
    titleZh: '青藏高原枪勇冰川近2500年融化强度变化数据',
    titleEn:
      'Long-term glacier melt fluctuations of Qiangyong Glacier on the Tibetan Plateau over the past 2500 yr',
    keywordZh: []
  },
  {
    datasetId: '94d90e88-9e17-4f48-828d-b5837d2a3fe0',
    titleZh: '长江源和黄河源水资源时空分布数据集（1998-2017）',
    titleEn:
      'The dataset of spatio-temporal water resources distribution in the source regions of Yangtze River and Yellow River (1998-2017)',
    keywordZh: []
  },
  {
    datasetId: 'd4c69e7f-eb88-4555-845a-1638fd8ca9d3',
    titleZh: '北半球湖冰物候数据集（1978-2018）',
    titleEn: 'The lake ice phenology dataset of the Northern Hemisphere (1978-2018)',
    keywordZh: []
  },
  {
    datasetId: '14246141-1b5d-40bb-aa48-7cd89cfa9cb0',
    titleZh: '青藏高原黑河多年冻土区热融滑塌遥感产品（2009-2018）',
    titleEn:
      'Remote sensing products of thermal collapse in Heihe permafrost region of the Tibetan Plateau (2009-2018)',
    keywordZh: []
  },
  {
    datasetId: '4ac14fc7-8c87-4d4e-95dd-43b254d6b7dd',
    titleZh: '阿勒泰地区雪冰吸光性杂质数据（2016-2017）V1.0',
    titleEn: 'Absorptive impurity data of snow and ice in Altay (2016-2017) v1.0',
    keywordZh: []
  },
  {
    datasetId: '4770c46b-75c4-4281-af70-4c9476357801',
    titleZh: '青藏高原黑河流域野牛沟冻土活动层厚度数据(2014-2018)',
    titleEn:
      'Thickness data of active layer in the Yeniugou of the Heihe River Basin over Tibetan Plateau (2014-2018)',
    keywordZh: []
  },
  {
    datasetId: 'ef1d8c6f-568d-432b-8708-da90925a92af',
    titleZh: '基于MODIS的青藏高原逐日湖冰范围和覆盖比例数据集（2002-2018）',
    titleEn:
      'Daily lake ice extent and cover proportion dataset of the Tibetan Plateau based on MODIS (2002-2018)',
    keywordZh: []
  },
  {
    datasetId: '9764584a-f2df-455b-96ef-8e8968a230fa',
    titleZh: '全球长时间序列逐日雪深数据集（1980-2018）',
    titleEn: 'Long-term series of daily global snow depth (1979-2017)',
    keywordZh: []
  }
]

export const PERMAFROST_TPDC_RELATED_DATASETS: RelatedDatasetItem[] =
  PERMAFROST_TPDC_RELATED_DATASETS_RAW.map((item) => ({
    ...item,
    url: tpdcDatasetDetailUrl(item.datasetId)
  }))

/**
 * 全球均一化地表风速数据集（1973-2024）
 * POST https://data.tpdc.ac.cn/view/metadataView/detail/ { metadataId: 6cd45030-c6fe-4eee-8c37-d3bfd930f6e5 }
 * relatedDataList
 */
export const WIND_SPEED_TPDC_DATASET_CSTR = '18406.11.Atmos.tpdc.301997'
export const WIND_SPEED_TPDC_DATASET_ID = '6a339bbe1771000054002c08'
export const WIND_SPEED_TPDC_METADATA_ID = '6cd45030-c6fe-4eee-8c37-d3bfd930f6e5'

const WIND_SPEED_TPDC_RELATED_DATASETS_RAW: RelatedDatasetItem[] = [
  {
    datasetId: 'ab6d60d2-0981-4510-9d94-7b68d00afb12',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（花寨子站涡动相关仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (eddy covariance system of Huazhaizi station, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'e1f562c3-5cf9-443f-89f3-0353962b0c60',
    titleZh:
      '祁连山综合观测网：黑河流域地表过程综合观测网（四道桥超级站气象要素梯度观测系统-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (an observation system of meteorological elements gradient of Sidaoqiao superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'c247aa2c-af7d-40eb-b6f4-bceae57e9369',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（景阳岭站自动气象站-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of the Heihe River Basin integrated observatory network (automatic weather station of Jingyangling station, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'd0b02dc9-4de5-46c4-bd8b-5aa5f23f3de5',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（荒漠站自动气象站-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (automatic weather station of desert station, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'd3571f89-2f66-4792-9860-887d9ba39fdc',
    titleZh: '祁连山综合观测网：青海湖流域地表过程综合观测网（混合草原超级站涡动相关仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Qinghai Lake integrated observatory network (eddy covariance system of Alpine meadow and grassland ecosystem Superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: '7532140a-74be-4fd7-9757-5f40bdffd0e7',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（黑河遥感站自动气象站-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of the Heihe River Basin integrated observatory network (automatic weather station of Heihe remote sensing station, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'f9d5a140-767d-44e8-b35d-b77ee319ad15',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（大满超级站大孔径闪烁仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (large aperture scintillometer of Daman Superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'c5a01e14-32fe-4aab-bc3a-f3f5d36cbdb8',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（大满超级站涡动相关仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (eddy covariance system of Daman Superstation, 2018)',
    keywordZh: []
  },
  {
    datasetId: 'b3d73026-48c7-4fcc-b4af-901dd57b264f',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（张掖湿地站涡动相关仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (eddy covariance system of Zhangye wetland station, 2018)',
    keywordZh: []
  },
  {
    datasetId: '77c7bfd5-38d3-41e2-93ce-cb4d8c0d475a',
    titleZh: '祁连山综合观测网：黑河流域地表过程综合观测网（荒漠站涡动相关仪-2018）',
    titleEn:
      'Qilian Mountains integrated observatory network: Dataset of Heihe integrated observatory network (eddy covariance system of desert station, 2018)',
    keywordZh: []
  }
]

export const WIND_SPEED_TPDC_RELATED_DATASETS: RelatedDatasetItem[] =
  WIND_SPEED_TPDC_RELATED_DATASETS_RAW.map((item) => ({
    ...item,
    url: tpdcDatasetDetailUrl(item.datasetId)
  }))

export function isPieridaeFeatureDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === PIERIDAE_FEATURE_DATASET_CSTR) return true
  if (detail.id === PIERIDAE_FEATURE_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('粉蝶标本图像特征')) return true
  return false
}

export function isMariculture2020Dataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === MARICULTURE_2020_DATASET_CSTR) return true
  if (detail.id === MARICULTURE_2020_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('海水养殖区矢量')) return true
  return false
}

export function isGuangdongSoilDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === GUANGDONG_SOIL_DATASET_CSTR) return true
  if (detail.id === GUANGDONG_SOIL_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('广东土种志')) return true
  return false
}

export function isGuangxiSoilDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === GUANGXI_SOIL_DATASET_CSTR) return true
  if (detail.id === GUANGXI_SOIL_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('广西土种志')) return true
  return false
}

export function isGuangdongLowcarbonAgriDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === GUANGDONG_LOWCARBON_AGRI_DATASET_CSTR) return true
  if (detail.id === GUANGDONG_LOWCARBON_AGRI_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('广东低碳农业绩效')) return true
  return false
}

export function isVenturiNozzleDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === VENTURI_NOZZLE_DATASET_CSTR) return true
  if (detail.id === VENTURI_NOZZLE_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('大喉径临界流文丘里喷嘴')) return true
  return false
}

export function isLinxingSandstoneDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === LINXING_SANDSTONE_DATASET_CSTR) return true
  if (detail.id === LINXING_SANDSTONE_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('临兴区块上古生界致密砂岩显微图像')) return true
  return false
}

export function isPretermPredictionDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === PRETERM_PREDICTION_DATASET_CSTR) return true
  if (detail.id === PRETERM_PREDICTION_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('早产预测模型')) return true
  return false
}

export function isChinaSoilArchiveDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === CHINA_SOIL_ARCHIVE_DATASET_CSTR) return true
  if (detail.id === CHINA_SOIL_ARCHIVE_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('中国土壤样品库')) return true
  return false
}

export function isXishuangbannaPlantsDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === XISHUANGBANNA_PLANTS_DATASET_CSTR) return true
  if (detail.id === XISHUANGBANNA_PLANTS_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('西双版纳民间传统利用植物')) return true
  return false
}

export function isIotNatDetectionDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === IOT_NAT_DETECTION_DATASET_CSTR) return true
  if (detail.id === IOT_NAT_DETECTION_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('active NAT detections for IoT')) return true
  return false
}

export function isAiDecisionBehaviorDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === AI_DECISION_BEHAVIOR_DATASET_CSTR) return true
  if (detail.id === AI_DECISION_BEHAVIOR_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('公平感知和信任感知的中介作用')) return true
  if (name.includes('Approach-Avoidance Behavior intentions')) return true
  return false
}

export function isYangtzeEstuaryBuoyDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === YANGTZE_ESTUARY_BUOY_DATASET_CSTR) return true
  if (detail.id === YANGTZE_ESTUARY_BUOY_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('长江口06号大型综合观测浮标')) return true
  return false
}

export function isSubtropicalPaddySoilDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === SUBTROPICAL_PADDY_SOIL_DATASET_CSTR) return true
  if (detail.id === SUBTROPICAL_PADDY_SOIL_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('亚热带区域稻田长期施肥定位试验')) return true
  return false
}

export function isBladderCancerDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === BLADDER_CANCER_DATASET_CSTR) return true
  if (detail.id === BLADDER_CANCER_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.toLowerCase().includes('bladder cancer')) return true
  return false
}

export function isJournalStandardsDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === JOURNAL_STANDARDS_DATASET_CSTR) return true
  if (detail.id === JOURNAL_STANDARDS_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('科技期刊编辑出版相关国家标准和行业标准')) return true
  return false
}

export function isSciDataSharing2015Dataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '')
  if (cstr === SCI_DATA_SHARING_2015_DATASET_CSTR) return true
  if (detail.id === SCI_DATA_SHARING_2015_SCIDB_DATASET_ID) return true
  const name = String(detail.name || '')
  if (name.includes('2015年科学研究数据共享现状调查')) return true
  return false
}

export function isYarlungTpdcDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '').toLowerCase()
  if (cstr === YARLUNG_TPDC_DATASET_CSTR.toLowerCase()) return true
  if (detail.id === YARLUNG_TPDC_DATASET_ID) return true
  if (detail.id === YARLUNG_TPDC_METADATA_ID) return true
  const name = String(detail.name || '')
  if (name.includes('雅鲁藏布江流域松散沉积物')) return true
  return false
}

export function isPermafrostTpdcDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '').toLowerCase()
  if (cstr === PERMAFROST_TPDC_DATASET_CSTR.toLowerCase()) return true
  if (detail.id === PERMAFROST_TPDC_DATASET_ID) return true
  if (detail.id === PERMAFROST_TPDC_METADATA_ID) return true
  const name = String(detail.name || '')
  if (name.includes('青藏高原多年冻土分布')) return true
  if (name.includes('冻结数模型') && name.includes('多年冻土')) return true
  return false
}

export function isWindSpeedTpdcDataset(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): boolean {
  if (!detail) return false
  const cstr = normalizeCstr(detail.cstr || '').toLowerCase()
  if (cstr === WIND_SPEED_TPDC_DATASET_CSTR.toLowerCase()) return true
  if (detail.id === WIND_SPEED_TPDC_DATASET_ID) return true
  if (detail.id === WIND_SPEED_TPDC_METADATA_ID) return true
  const name = String(detail.name || '')
  if (name.includes('全球均一化地表风速')) return true
  return false
}

export function getRelatedDatasetsForDetail(detail: {
  cstr?: string
  id?: string
  name?: string
} | null): RelatedDatasetItem[] {
  if (isPieridaeFeatureDataset(detail)) return PIERIDAE_FEATURE_RELATED_DATASETS
  if (isMariculture2020Dataset(detail)) return MARICULTURE_2020_RELATED_DATASETS
  if (isGuangdongSoilDataset(detail)) return GUANGDONG_SOIL_RELATED_DATASETS
  if (isGuangxiSoilDataset(detail)) return GUANGXI_SOIL_RELATED_DATASETS
  if (isGuangdongLowcarbonAgriDataset(detail)) return GUANGDONG_LOWCARBON_AGRI_RELATED_DATASETS
  if (isVenturiNozzleDataset(detail)) return VENTURI_NOZZLE_RELATED_DATASETS
  if (isLinxingSandstoneDataset(detail)) return LINXING_SANDSTONE_RELATED_DATASETS
  if (isPretermPredictionDataset(detail)) return PRETERM_PREDICTION_RELATED_DATASETS
  if (isChinaSoilArchiveDataset(detail)) return CHINA_SOIL_ARCHIVE_RELATED_DATASETS
  if (isXishuangbannaPlantsDataset(detail)) return XISHUANGBANNA_PLANTS_RELATED_DATASETS
  if (isIotNatDetectionDataset(detail)) return IOT_NAT_DETECTION_RELATED_DATASETS
  if (isAiDecisionBehaviorDataset(detail)) return AI_DECISION_BEHAVIOR_RELATED_DATASETS
  if (isYangtzeEstuaryBuoyDataset(detail)) return YANGTZE_ESTUARY_BUOY_RELATED_DATASETS
  if (isSubtropicalPaddySoilDataset(detail)) return SUBTROPICAL_PADDY_SOIL_RELATED_DATASETS
  if (isBladderCancerDataset(detail)) return BLADDER_CANCER_RELATED_DATASETS
  if (isJournalStandardsDataset(detail)) return JOURNAL_STANDARDS_RELATED_DATASETS
  if (isSciDataSharing2015Dataset(detail)) return SCI_DATA_SHARING_2015_RELATED_DATASETS
  if (isYarlungTpdcDataset(detail)) return YARLUNG_TPDC_RELATED_DATASETS
  if (isPermafrostTpdcDataset(detail)) return PERMAFROST_TPDC_RELATED_DATASETS
  if (isWindSpeedTpdcDataset(detail)) return WIND_SPEED_TPDC_RELATED_DATASETS
  return []
}
