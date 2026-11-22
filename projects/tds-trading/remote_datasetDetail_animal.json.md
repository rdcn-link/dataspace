在该项目中的TradingApplicationTests添加一个方法，同步数据集，读取一个json文件，
示例为

```json
[
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"kizdc\" : \"http://datacenter.kiz.ac.cn/\", \"language\" : \"zh\" }",
    "@id": "18406.11.ECOLO.TPDC.270374",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "71",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "717388",
    "dct:fundingReferences": "[ { \"@id\" : \"XDA20000000\", \"@type\" : \"泛第三极环境变化与绿色丝绸之路建设专项\", \"schema:name\" : \"中国现代人群代谢组数据集v1.0\" } ]",
    "dct:Subject": "{ \"@value\" : [ \"藏族人群；古人类\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_14cb",
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": "[ \"http://datacenter.kiz.ac.cn/Home/DataContent?data_gd=958B15A2-0DB3-422A-9C73-4E68649DC9F0\" ]",
    "schema:contributor": "[ { \"@type\" : \"dct:DataCollector\", \"@id\" : \"13\", \"schema:name\" : \"李功华\", \"schema:worksFor\" : \"中国科学院昆明动物研究所\", \"schema:email\" : \"kizdatacenter@mail.kiz.ac.cn\" } ]",
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:creator": "[ { \"@List\" : [ { \"@id\" : \"13\", \"@type\" : \"schema:Person\", \"schema:name\" : \"李功华\", \"schema:worksFor\" : \"中国科学院昆明动物研究所\", \"schema:email\" : \"kizdatacenter@kiz.ac.cn\" } ] } ]",
    "schema:datePublished": "2021-03-23T13:48:18+08:00",
    "schema:description": "[ { \"@value\" : \"藏族人群如何适应高原极端环境目前还并不清楚。而代谢作为重要的表型，在保持个体正常生物学功能中发挥了重要作用，已有研究表明一些代谢小分子可以通过调控能量代谢、氧化应激等生物学过程以适应外界的极端环境。鉴于此，项目通过研究藏族人群相比平原人群的特有的代谢特征，有望发现人体代谢与极端环境适应的关系，进而以代谢的视角研究藏族人群的高原适应机制。该数据是项目实施过程中产生的代谢组数据，目前的数据包括了30例平原人群的代谢组数据；利用这批数据与后续的代谢组数据进行联合分析，可以用来研究高原藏族人群在高原低氧环境下的代谢特征。\", \"@language\" : \"zh\" } ]",
    "schema:encodingFormat": "rar",
    "schema:identifier": null,
    "schema:keywords": "[ { \"@value\" : \"藏族人群；古人类\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@value\" : \"中国现代人群代谢组数据集v1.0\", \"@language\" : \"zh\" } ]",
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn/34735\", \"schema:name\" : \"中国科学院昆明动物研究所\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#IOZ\", \"schema:name\" : \"中国科学院动物研究所\", \"schema:logo:\" : \"http://datacenter.kiz.ac.cn/Content/images/top_title.jpg\" }",
    "schema:url": "http://datacenter.kiz.ac.cn/Home/DataContent?data_gd=958B15A2-0DB3-422A-9C73-4E68649DC9F0",
    "schema:version": "1"
  },
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"kizdc\" : \"http://datacenter.kiz.ac.cn/\", \"language\" : \"zh\" }",
    "@id": "18406.11.ECOLO.TPDC.271066",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "71",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "717388",
    "dct:fundingReferences": "[ { \"@id\" : \"XDA20000000\", \"@type\" : \"泛第三极环境变化与绿色丝绸之路建设专项；第二次青藏高原综合科学考察研究\", \"schema:name\" : \"主要家养动物转录组测序数据（2020）\" } ]",
    "dct:Subject": "{ \"@value\" : [ \"肯尼亚；家养动物；动物；生物圈\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_14cb",
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": "[ \"http://datacenter.kiz.ac.cn/Home/DataContent?data_gd=4DD6758F-AFEE-4A04-8B75-B070CB88883C\" ]",
    "schema:contributor": "[ { \"@type\" : \"dct:DataCollector\", \"@id\" : \"13\", \"schema:name\" : \"彭旻晟\", \"schema:worksFor\" : \"中国科学院昆明动物研究所\", \"schema:email\" : \"kizdatacenter@mail.kiz.ac.cn\" } ]",
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:creator": "[ { \"@List\" : [ { \"@id\" : \"13\", \"@type\" : \"schema:Person\", \"schema:name\" : \"彭旻晟\", \"schema:worksFor\" : \"中国科学院昆明动物研究所\", \"schema:email\" : \"kizdatacenter@kiz.ac.cn\" } ] } ]",
    "schema:datePublished": "2021-03-23T14:04:16+08:00",
    "schema:description": "[ { \"@value\" : \"为描述青藏高原及周边地区（泛第三极地区）主要驯化动物遗传多样性的分布格局，厘清其相关遗传背景。2020年我们选取31个肯尼亚当地商品鸡和土鸡肾、脾、空肠RNA组织样品，提取总RNA后建库并做转录组测序。测序产生了一批180G转录组测序原始数据。为探索泛第三极地区家鸡驯化、迁徙、扩张等群体历史事件提供基础数据，并进一步探讨驯化动物对干燥等恶劣环境的适应机理提供资料。本数据集包含31个家鸡个体物种、品种、性别、表型等基本样品信息excel表，和31个家鸡个体3种组织转录组测序原始数据及MD5值。\", \"@language\" : \"zh\" } ]",
    "schema:encodingFormat": "rar",
    "schema:identifier": null,
    "schema:keywords": "[ { \"@value\" : \"肯尼亚；家养动物；动物；生物圈\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@value\" : \"主要家养动物转录组测序数据（2020）\", \"@language\" : \"zh\" } ]",
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn/34735\", \"schema:name\" : \"中国科学院昆明动物研究所\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#IOZ\", \"schema:name\" : \"中国科学院动物研究所\", \"schema:logo:\" : \"http://datacenter.kiz.ac.cn/Content/images/top_title.jpg\" }",
    "schema:url": "http://datacenter.kiz.ac.cn/Home/DataContent?data_gd=4DD6758F-AFEE-4A04-8B75-B070CB88883C",
    "schema:version": "1"
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

"schema:name": "[ { \"@value\" : \"中国现代人群代谢组数据集v1.0\", \"@language\" : \"zh\" } ]",对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",如果该项为空则跳过该数据集

"schema:author":"陈焱森",对应\"nameZh\" : \"王杰\","schema:author"如果为空则也为空

"dcat:byteSize": "717388",对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://datacenter.kiz.ac.cn/Content/images/top_title.jpg
"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"cstr": "18406.11.Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应cstr

"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"doi": "10.11888/Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应doi

"downloadCount": NumberLong("2"),默认为 0

"fileNumber": NumberInt("1"),默认为 0

"schema:description": "[ { \"@value\" : \"藏族人群如何适应高原极端环境目前还并不清楚。而代谢作为重要的表型，在保持个体正常生物学功能中发挥了重要作用，已有研究表明一些代谢小分子可以通过调控能量代谢、氧化应激等生物学过程以适应外界的极端环境。鉴于此，项目通过研究藏族人群相比平原人群的特有的代谢特征，有望发现人体代谢与极端环境适应的关系，进而以代谢的视角研究藏族人群的高原适应机制。该数据是项目实施过程中产生的代谢组数据，目前的数据包括了30例平原人群的代谢组数据；利用这批数据与后续的代谢组数据进行联合分析，可以用来研究高原藏族人群在高原低氧环境下的代谢特征。\", \"@language\" : \"zh\" } ]",对应"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，"schema:description"如果为空则也为空

"schema:keywords": "[ { \"@value\" : \"藏族人群；古人类\", \"@language\" : \"zh\" } ]",中的藏族人群；古人类,对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"shareMode": "PUBLIC",全部设置为"shareMode": "PUBLIC"

"source": "国家青藏高原科学数据中心",全部设置为中国科学院昆明动物研究所

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"schema:version": "V1",,对应"version": "V1",

"dct:Subject": "{ \"@value\" : [ \"藏族人群；古人类\" ], \"@type\" : \"GB/T 13745-2009\" }",中的藏族人群；古人类,对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

