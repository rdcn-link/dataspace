在该项目中的TradingApplicationTests添加一个方法，同步数据集，读取一个json文件，
示例为

```json
[
  {
    "@context": "{ \"@language\" : \"zh\", \"casdc\" : \"http://casdc.cn/md/\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcat\" : \"http://www.w3.org/ns/dcat#\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\" }",
    "@id": "https://doi.org/10.12149/100036",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdSchema": "{ \"schema:name\" : \"天文观测数据集元数据模版\", \"schema:url\" : \"https://nadc.china-vo.org/res/DatasetTemplate\" }",
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "122880.0",
    "dct:Subject": "{ \"@type\" : \"GB/T 13745-2009\", \"@value\" : [ \"宇宙学和星系\" ] }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_abf2",
    "http://www\\u002Ere3data\\u002Eorg/schema/3-1/accessRestrictions": "在线开放",
    "https://www\\u002Ew3\\u002Eorg/TR/2020/REC-vocab-dcat-2-20200204/hasCurrentVersion": "V1",
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:creator": "[ { \"@type\" : \"schema:Person\", \"schema:email\" : \"wuxb@pku.edu.cn\", \"schema:name\" : [ \"Xue-Bing Wu\", { \"@language\" : \"en\", \"@value\" : \"Xue-Bing Wu\" } ], \"schema:worksFor\" : \"Department of Astronomy, School of Physics, Peking University; Kavli Institute for Astronomy and Astrophysics, Peking University\" } ]",
    "schema:datePublished": "2019-01-31T00:00:00+08:00",
    "schema:description": "[ { \"@language\" : \"zh\", \"@value\" : \"LAMOST光谱巡天类星体星表数据，此星表是从LAMOST第一期巡天（2011-2017）结束后，从DR1-DR5数据中挑选出的类星体数据，共计42567条记录。其中第一次数据释放详细信息见Ai et al. (2016)，第二次数据释放详细信息见Dong et al. (2018)，第三次数据释放详细信息见Yao et al. (2019).\" }, { \"@language\" : \"en\", \"@value\" : \"The LAMOST Quasar Catalog provides 42567 quasars selected from LAMOST DR1- DR5 after the completion of LAMOST Phase-I (2012-2017) Regular Surveys. Full content and detailed description can be found in Ai et al. (2016), Dong et al. (2018) and Yao et al. (2019).\" } ]",
    "schema:identifier": "[ { \"@id\" : \"https://doi.org/10.12149/100036\", \"@type\" : \"dct:DOI\" }, { \"@id\" : \"https://cstr.escience.org.cn/CSTR:11379.11.100036\", \"@type\" : \"casdc:CSTR\" } ]",
    "schema:keywords": "[ \"LAMOST\", \"Survey；spectra\", \" catalog\", \"QSO\" ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@language\" : \"zh\", \"@value\" : \"LAMOST光谱巡天类星体巡天数据\" }, { \"@language\" : \"en\", \"@value\" : \"LAMOST Quasar \" } ]",
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn//11379\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"国家天文科学数据中心\" }",
    "schema:sourceOrganization": "{ \"schema:name\" : \"Department of Astronomy, School of Physics, Peking University; Kavli Institute for Astronomy and Astrophysics, Peking University\" }",
    "schema:url": "http://nadc.china-vo.org/res/r100036",
    "schema:version": "V1"
  },
  {
    "@context": "{ \"@language\" : \"zh\", \"casdc\" : \"http://casdc.cn/md/\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcat\" : \"http://www.w3.org/ns/dcat#\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\" }",
    "@id": "https://doi.org/10.12149/100013",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdSchema": "{ \"schema:name\" : \"天文观测数据集元数据模版\", \"schema:url\" : \"https://nadc.china-vo.org/res/DatasetTemplate\" }",
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "1776287744.0",
    "dct:Subject": "{ \"@type\" : \"GB/T 13745-2009\", \"@value\" : [ \"宇宙学和星系\", \"恒星与星际物质\" ] }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_abf2",
    "http://www\\u002Ere3data\\u002Eorg/schema/3-1/accessRestrictions": "在线开放",
    "https://www\\u002Ew3\\u002Eorg/TR/2020/REC-vocab-dcat-2-20200204/hasCurrentVersion": "V1",
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:creator": "[ { \"@type\" : \"schema:Person\", \"schema:email\" : \"support@lamost.org\", \"schema:name\" : [ \"LAMOST运行发展中心\", { \"@language\" : \"en\", \"@value\" : \"LAMOST Operation and Development Center\" } ], \"schema:worksFor\" : \"中国科学院国家天文台\" } ]",
    "schema:datePublished": "2019-06-30T00:00:00+08:00",
    "schema:description": "[ { \"@language\" : \"zh\", \"@value\" : \"LAMOST第五次巡天数据发布第三版（DR5V3）包括有先导巡天和前五年巡天的光谱数据，观测时间自2011年10月24日开始，到2017年6月16日结束，共观测4154个天区，DR5V3共释放光谱数共计9,026,365，其中还包括534万颗恒星光谱参数星表。\" }, { \"@language\" : \"en\", \"@value\" : \"LAMOST Data Release 5  V3 (DR5 V3) includes spectra from the LAMOST pilot and four years regular survey from October 24, 2011 to June 16, 2017, observing 4154 plates and releases a total of 9,026,365 spectra, including 5.34 million A, F, G and K type stars catalog.\" } ]",
    "schema:identifier": "[ { \"@id\" : \"https://doi.org/10.12149/100013\", \"@type\" : \"dct:DOI\" }, { \"@id\" : \"https://cstr.escience.org.cn/CSTR:11379.11.100013\", \"@type\" : \"casdc:CSTR\" } ]",
    "schema:keywords": "[ \"LAMOST\", \"Survey\" ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@language\" : \"zh\", \"@value\" : \"LAMOST光谱巡天第五次数据发布第三版\" }, { \"@language\" : \"en\", \"@value\" : \"LAMOST Data Release 5 v3\" } ]",
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn//11379\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"国家天文科学数据中心\" }",
    "schema:sourceOrganization": "{ \"schema:name\" : \"中国科学院国家天文台\" }",
    "schema:url": "http://nadc.china-vo.org/res/r100013",
    "schema:version": "V1"
  },
  {
       ..... 
  }
]
```





dataset数据集实体示例如下

```json
{
    "_id": ObjectId("6a508cbc827e00003b005cc7"),
    "_class": "cn.tds.common.domain.DataSet",
    "authors": "[ { \"nameZh\" : \"王杰\", \"nameEn\" : \"王杰\", \"orcId\" : \"\", \"organizations\" : [ { \"nameZh\" : \"\", \"nameEn\" : \"\", \"order\" : { \"$numberInt\" : \"1\" } } ], \"email\" : \"\", \"country_name\" : [ ] },{ \"nameZh\" : \" 张倩\", \"nameEn\" : \" 张倩\", \"orcId\" : \"\", \"organizations\" : [ { \"nameZh\" : \"\", \"nameEn\" : \"\", \"order\" : { \"$numberInt\" : \"1\" } } ], \"email\" : \"\", \"country_name\" : [ ] } ]",
    "byteSize": "1707249500",
    "count": NumberLong("0"),
    "coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",
    "cstr": "18406.11.Atmos.tpdc.303450",
    "dataSetId": null,
    "doi": "10.11888/Atmos.tpdc.303450",
    "downloadCount": NumberLong("2"),
    "fileNumber": NumberInt("1"),
    "introductionEh": null,
    "introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。",
    "keywordsEn": "[ \"temperature\";\"precipitation\";\"Wind\" ]",
    "keywordsZh": "[ \"温度\";\"降水\";\"风\" ]",
    "publisher": "DATA TPDC AC",
    "shareMode": "PUBLIC",
    "source": "国家青藏高原科学数据中心",
    "status": NumberInt("9"),
    "subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",
    "titleEn": "Daily 0.1 ° corrected meteorological dataset for the Yellow River source (1951-2024)",
    "titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",
    "type": null,
    "updateAt": ISODate("2026-04-22T03:13:08.000Z"),
    "version": "V1",
    "viewCount": NumberLong("40")
}

```





要求

"schema:name": "[ { \"@language\" : \"zh\", \"@value\" : \"LAMOST光谱巡天第五次数据发布第三版\" }, { \"@language\" : \"en\", \"@value\" : \"LAMOST Data Release 5 v3\" } ]"中的LAMOST光谱巡天第五次数据发布第三版,对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",如果该项为空则跳过该数据集

"schema:author":"陈焱森",对应\"nameZh\" : \"王杰\","schema:author"如果为空则也为空

"dcat:byteSize": "717388",对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://datacenter.kiz.ac.cn/Content/images/top_title.jpg
"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"cstr": "18406.11.Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应cstr

"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"doi": "10.11888/Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应doi

"downloadCount": NumberLong("2"),默认为 0

"casdc:fileNumber": "3",对应"fileNumber": NumberInt("1")

"schema:description": "[ { \"@value\" : \"藏族人群如何适应高原极端环境目前还并不清楚。而代谢作为重要的表型，在保持个体正常生物学功能中发挥了重要作用，已有研究表明一些代谢小分子可以通过调控能量代谢、氧化应激等生物学过程以适应外界的极端环境。鉴于此，项目通过研究藏族人群相比平原人群的特有的代谢特征，有望发现人体代谢与极端环境适应的关系，进而以代谢的视角研究藏族人群的高原适应机制。该数据是项目实施过程中产生的代谢组数据，目前的数据包括了30例平原人群的代谢组数据；利用这批数据与后续的代谢组数据进行联合分析，可以用来研究高原藏族人群在高原低氧环境下的代谢特征。\", \"@language\" : \"zh\" } ]",对应"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，"schema:description"如果为空则也为空

"schema:keywords": "[ \"LAMOST\", \"Survey\" ]",中的LAMOST、Survey,对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"shareMode": "PUBLIC",全部设置为"shareMode": "PUBLIC"

"source": "国家青藏高原科学数据中心",全部设置为国家天文科学数据中心

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"schema:version": "V1",,对应"version": "V1",

 "dct:Subject": "{ \"@value\" : [ \"水资源保护\", \"水环境评价）\", \"生态系统生态学\", \"水生生态学与湖泊生态学\", \"群落生态学\" ], \"@type\" : \"GB/T\" }",中的藏族人群；古人类,对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

