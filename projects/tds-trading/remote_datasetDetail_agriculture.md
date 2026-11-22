在该项目中的TradingApplicationTests添加一个方法，同步数据集，读取一个json文件，
示例为

```json
[
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"@language\" : \"zh\" }",
    "@id": "http://www.igadc.cn/info/u068a",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "0",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdAccessRights": null,
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "0",
    "dct:fundingReferences": null,
    "dct:Subject": "{ \"@value\" : [ \"农业生态学\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_16ec",
    "http://www\\u002Ere3data\\u002Eorg/schema/3-1/accessRestrictions": "",
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": "",
    "schema:author": null,
    "schema:correspondingAuthor": null,
    "schema:correspondingAuthorName": null,
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:datePublished": "2020-12-12T09:33:20+08:00",
    "schema:description": "[ { \"@value\" : \"本数据集为上世纪七十年代内蒙古的农家及引进的作物品种，包括谷物、马铃薯、杂豆、油料作物及经济作物。\", \"@language\" : \"zh\" } ]",
    "schema:encodingFormat": "[ \"7z\" ]",
    "schema:identifier": null,
    "schema:image": "http://www.igadc.cn/static/cache/u068a.jpg",
    "schema:keywords": "[ { \"@value\" : \"栽培\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@value\" : \"内蒙古农作物品种数据集(1977年)\", \"@language\" : \"zh\" } ]",
    "schema:paper": null,
    "schema:publisher": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NEIGAE\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院东北地理与农业生态研究所\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NEIGAE\", \"schema:name\" : \"中国科学院东北地理与农业生态研究所\", \"schema:logo\" : \"http://www.iga.ac.cn/images/logo-dbdl.png\" }",
    "schema:url": "http://www.igadc.cn/info/u068a",
    "schema:version": "1"
  },
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"@language\" : \"zh\" }",
    "@id": "http://www.igadc.cn/info/od5b6",
    "@type": "dcmi:Dataset",
    "casdc:fileNumber": "0",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdAccessRights": null,
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "0",
    "dct:fundingReferences": null,
    "dct:Subject": "{ \"@value\" : [ \"区域生态学\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_16ec",
    "http://www\\u002Ere3data\\u002Eorg/schema/3-1/accessRestrictions": "",
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": "",
    "schema:author": null,
    "schema:correspondingAuthor": null,
    "schema:correspondingAuthorName": null,
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:datePublished": "2022-10-31T21:32:53+08:00",
    "schema:description": "[ { \"@value\" : \"本数据集包括2013年吉林省农安、德惠、九台等26个县市土壤质量评价数据集，通过遥感反演的方式，反映了松嫩平原北部地区范围内的有机质分布情况，为土壤修复、土地规划等方面提供数据支撑。\", \"@language\" : \"zh\" } ]",
    "schema:encodingFormat": "[ \"7z\" ]",
    "schema:identifier": null,
    "schema:image": "http://www.igadc.cn/static/upload/a0/a075010e-591f-11ed-8662-00163e042936_m.jpg",
    "schema:keywords": "[ { \"@value\" : \"农安、德惠、九台等26个县市，土壤质量\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@value\" : \"吉林省农安、德惠、九台等26个县市125万、100 m土壤质量评价数据集2013年\", \"@language\" : \"zh\" } ]",
    "schema:paper": null,
    "schema:publisher": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NEIGAE\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院东北地理与农业生态研究所\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NEIGAE\", \"schema:name\" : \"中国科学院东北地理与农业生态研究所\", \"schema:logo\" : \"http://www.iga.ac.cn/images/logo-dbdl.png\" }",
    "schema:url": "http://www.igadc.cn/info/od5b6",
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

"schema:name": "内蒙古农作物品种数据集(1977年)",对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",如果该项为空则跳过该数据集

"schema:author":"陈焱森",对应\"nameZh\" : \"王杰\","schema:author"如果为空则也为空

"dcat:byteSize": "123",,对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://www.iga.ac.cn/images/logo-dbdl.png
"@id": "http://www.igadc.cn/info/u068a",中的u068a,对应"cstr": "18406.11.Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应cstr

"@id": "http://www.igadc.cn/info/u068a",中的u068a,对应"doi": "10.11888/Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应doi

"downloadCount": NumberLong("2"),默认为 0

"fileNumber": NumberInt("1"),默认为 0

"schema:description": "[ { \"@value\" : \"本数据集为上世纪七十年代内蒙古的农家及引进的作物品种，包括谷物、马铃薯、杂豆、油料作物及经济作物。\", \"@language\" : \"zh\" } ]","introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，"schema:description"如果为空则也为空

"schema:keywords": "[ { \"@value\" : \"栽培\", \"@language\" : \"zh\" } ]",中的栽培,对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"shareMode": "PUBLIC",全部设置为"shareMode": "PUBLIC"

"source": "国家青藏高原科学数据中心",全部设置为为 中国科学院东北地理与农业生态研究所

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"schema:version": "V1",,对应"version": "V1",

"dct:Subject": "{ \"@value\" : [ \"农业生态学\" ], \"@type\" : \"GB/T 13745-2009\" }",中的农业生态学,对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

