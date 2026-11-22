在该项目中的TradingApplicationTests添加一个方法，同步数据集，读取一个json文件，
示例为

```json
[
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"@language\" : \"zh\" }",
    "@id": "http://doi.org/10.12091/fossil-ontology.20220707",
    "@type": "dcmi:Dataset",
    "casdc:dateAvailable": "2021-12-29T00:00:00+08:00",
    "casdc:fileNumber": "3",
    "casdc:ftpUrlInfo": null,
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:processingDescription": "Supplementary material includes one supporting table showing the occurrences of the dispersed spore Acinosporites lindlarensis and Leclercqia species.",
    "casdc:sdAccessRights": null,
    "casdc:sdCreator": "{ \"@id\" : [ \"https://orcid.org/0000-0003-3541-9023\", \"https://orcid.org/0000-0002-7842-1468\" ] }",
    "casdc:sdSchema": "{ \"schema:url\" : \"http://fossil-ontology.com:8091/upload/DbMetadata-fossil.xml\", \"schema:name\" : \"中国科学院南京地质古生物数据中化石标本数据集元数据模版\" }",
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "123",
    "dct:fundingReferences": "[ { \"@id\" : \"XDA19050101\", \"@type\" : \"战略性先导科技专项(A 类)\", \"schema:funder\" : \"中科院\", \"schema:name\" : \"地球古生物多样性数据平台\", \"schema:description\" : \"略。。。\" } ]",
    "dct:Subject": "{ \"@value\" : [ \"古生物学\" ], \"@type\" : \"GB/T 170-5041\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_abf2",
    "dcterms:isReferencedBy": "{ \"@id\" : \"http://doi.org/10.12091/fossil-ontology.20220707\", \"@type\" : \"dcmi:Dataset\", \"schema:name\" : { \"@value\" : \"Spatio-temporal distribution of Leclercqia (Lycopsida), with its new discovery from the Middle to Upper devonian of Yunnan, South China\", \"@language\" : \"en\" }, \"schema:keywords\" : [ { \"@value\" : \"Occurrence\", \"@language\" : \"en\" }, { \"@value\" : \"Big data\", \"@language\" : \"en\" }, { \"@value\" : \"Palaeobotany\", \"@language\" : \"en\" }, { \"@value\" : \"Biogeography\", \"@language\" : \"en\" }, { \"@value\" : \"Tentaculitoid\", \"@language\" : \"en\" } ], \"schema:identifier\" : { \"@id\" : \"http://doi.org/10.12091/fossil-ontology.20220707\", \"@type\" : \"dct:DOI\" }, \"schema:license\" : \"https://creativecommons.org/licenses/by/4.0/\", \"schema:publisher\" : { \"@id\" : \"https://www.cstr.cn/35614\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院南京地质古生物研究所数据中心\" } }",
    "dcterms:references": "{ \"@id\" : \"https://doi.org/10.1016/j.palaeo.2020.110029\", \"@type\" : \"dcmi:Dataset\", \"schema:name\" : { \"@value\" : \"Spatio-temporal distribution of Leclercqia (Lycopsida), with its new discovery from the Middle to Upper devonian of Yunnan, South China\", \"@language\" : \"en\" }, \"schema:keywords\" : [ { \"@value\" : \"Occurrence\", \"@language\" : \"en\" }, { \"@value\" : \"Big data\", \"@language\" : \"en\" }, { \"@value\" : \"Palaeobotany\", \"@language\" : \"en\" }, { \"@value\" : \"Biogeography\", \"@language\" : \"en\" }, { \"@value\" : \"Tentaculitoid\", \"@language\" : \"en\" } ], \"schema:identifier\" : { \"@id\" : \"http://doi.org/10.12091/fossil-ontology.20220707\", \"@type\" : \"dct:DOI\" }, \"schema:license\" : \"https://creativecommons.org/licenses/by/4.0/\", \"schema:publisher\" : { \"@id\" : \"https://www.cstr.cn/34735\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院南京地质古生物所所级数据中心\", \"schema:datePublished\" : \"2022-03-29T00:00:00+08:00\" } }",
    "http://:doi\\u002Eorg/10\\u002E12091/fossil-ontology\\u002E20220707": "全部共享（数据保护期外，提供全部数据和媒体下载）",
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": "[ \"http://download.fossil-ontology.com:8080/share.cgi?ssid=ee4dacd8105241ae81058c11abcaebae&fid=ee4dacd8105241ae81058c11abcaebae&filename=Fossil%20Occurrence&openfolder=forcedownload&ep=\" ]",
    "https://www\\u002Ew3\\u002Eorg/TR/2020/REC-vocab-dcat-2-20200204/hasCurrentVersion": "Version 1",
    "schema:author": null,
    "schema:contributor": "[ { \"@type\" : \"dct:DataCollector\", \"@id\" : \"https://orcid.org/0000-0002-7842-1468\", \"schema:name\" : \"徐老师\", \"schema:worksFor\" : \"中国科学院南京地质古生物研究所\", \"schema:email\" : \"hhxu@nigpas.ac.cn\" } ]",
    "schema:copyrightHolder": "中国科学院南京地质古生物研究所数据中心",
    "schema:correspondingAuthor": null,
    "schema:correspondingAuthorName": null,
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:creator": "[ { \"@list\" : [ { \"@id\" : \"https://orcid.org/0000-0002-7842-1468\", \"@type\" : \"schema:Person\", \"schema:name\" : \"徐老师\", \"schema:worksFor\" : \"中国科学院南京地质古生物研究所\", \"schema:email\" : \"hhxu@nigpas.ac.cn\" }, { \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NIGPAS\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院南京地质古生物研究所\", \"schema:email\" : \"ngb@nigpas.ac.cn\" } ] } ]",
    "schema:dateOfPatent": null,
    "schema:datePublished": "2021-12-14T09:32:05+08:00",
    "schema:description": "[ { \"@value\" : \"古生物化石标本\", \"@language\" : \"zh\" }, { \"@value\" : \"paleontology fossil specimen occurrence.\", \"@language\" : \"en\" } ]",
    "schema:encodingFormat": "rar",
    "schema:identifier": "[ { \"@id\" : \"http://doi.org/10.12091/fossil-ontology.20220707\", \"@type\" : \"dct:DOI\" }, { \"@id\" : \"https://cstr.cn/CSTR:35614.14.NIGPAS\", \"@type\" : \"casdc:CSTR\" } ]",
    "schema:image": "http://fossil-ontology.com:8181/profile/upload/2022/06/30/a8503643-9654-40dc-b154-25beb8be5ee5.jpg",
    "schema:includedInDataCatalog": "古生物化石",
    "schema:ipc": null,
    "schema:keywords": "[ { \"@value\" : \"古生物化石\", \"@language\" : \"zh\" }, { \"@value\" : \"化石标本\", \"@language\" : \"zh\" }, { \"@value\" : \"fossil specimen occurrence\", \"@language\" : \"en\" }, { \"@value\" : \"fossil\", \"@language\" : \"en\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by/4.0/",
    "schema:name": "[ { \"@value\" : \"古生物化石标本数据库\", \"@language\" : \"zh\" }, { \"@value\" : \"paleontology fossil specimen occurrence database\", \"@language\" : \"en\" } ]",
    "schema:patentNumber": null,
    "schema:provider": "中国科学院南京地质古生物研究所数据中心",
    "schema:publicationNumber": null,
    "schema:publisher": "{ \"@type\" : \"casdc:Organization\", \"@id\" : \"https://cstr.cn/CSTR:35614\", \"schema:name\" : \"南京古生物数据中心\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs#NIGPAS\", \"schema:name\" : \"中国科学院南京地质古生物研究所\", \"schema:logo:\" : \"http://geobiodiversity.com:8080/download/nigpas/nigpas.png\" }",
    "schema:url": "http://doi.org/10.12091/fossil-ontology.20220707",
    "schema:version": "V1",
    "schema:yearPublished": null
  },
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"dcat\" : \"http://www.w3.org/ns/dcat#\", \"@language\" : \"zh\" }",
    "@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",
    "@type": "dcmi:Dataset",
    "casdc:dateAvailable": null,
    "casdc:fileNumber": "4",
    "casdc:ftpUrlInfo": null,
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:processingDescription": null,
    "casdc:sdAccessRights": "http://purl.org/coar/access_right/c_abf2",
    "casdc:sdCreator": null,
    "casdc:sdSchema": null,
    "casdc:sensitiveContent": "yes",
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "14521910",
    "dct:fundingReferences": "[ { \"@type\" : \"中国科学院-中国科学院战略性先导科技专项（B类）\", \"@id\" : \"XDB26010000\", \"schema:name\" : \"生物宏演化和高精度年代框架\" } ]",
    "dct:Subject": "{ \"@value\" : [ \"地球科学\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_abf2",
    "dcterms:isReferencedBy": null,
    "dcterms:references": null,
    "http://:doi\\u002Eorg/10\\u002E12091/fossil-ontology\\u002E20220707": null,
    "http://www\\u002Ew3\\u002Eorg/ns/dcat#downloadURL": null,
    "https://www\\u002Ew3\\u002Eorg/TR/2020/REC-vocab-dcat-2-20200204/hasCurrentVersion": null,
    "schema:author": "[ { \"@list\" : [ { \"@type\" : \"schema:Person\", \"schema:name\" : \"陈焱森\", \"schema:worksFor\" : \"\", \"schema:email\" : \"yschen@nigpas.ac.cn\" } ] } ]",
    "schema:contributor": null,
    "schema:copyrightHolder": null,
    "schema:correspondingAuthor": "yschen@nigpas.ac.cn",
    "schema:correspondingAuthorName": "南古所",
    "schema:creativeWorkStatus": "http://inspire.ec.europa.eu/registry/status/retired",
    "schema:creator": null,
    "schema:dateOfPatent": null,
    "schema:datePublished": "2024-07-05T09:20:09+08:00",
    "schema:description": "埃迪卡拉纪陡山沱组硅质结核图",
    "schema:encodingFormat": null,
    "schema:identifier": "[ { \"@type\" : \"https://www.iana.org/assignments/uri-schemes/prov/cstr\", \"@id\" : \"https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa\" } ]",
    "schema:image": null,
    "schema:includedInDataCatalog": null,
    "schema:ipc": null,
    "schema:keywords": "[ { \"@value\" : \"生物宏演\", \"@language\" : \"zh\" }, { \"@value\" : \"高精度年代框架\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by-nd/4.0/",
    "schema:name": "[ { \"@value\" : \"埃迪卡拉纪陡山沱组硅质结核图\", \"@language\" : \"zh\" }, { \"@value\" : \"埃迪卡拉纪陡山沱组硅质结核图\", \"@language\" : \"en\" } ]",
    "schema:patentNumber": null,
    "schema:provider": null,
    "schema:publicationNumber": null,
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn/35614\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院南京地质古生物研究所所级中心\" }",
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs\", \"schema:logo\" : \"http://127.0.0.1:8081/api/banaer_icoLogo/b0d8a5b0894f452f9f04ad6c4bee2264.png\", \"schema:name\" : \"中国科学院南京地质古生物研究所所级中心\" }",
    "schema:url": "http://127.0.0.1:8081/dataDetails/824bbac88fdf490c906fb4b725f120d6",
    "schema:version": "V1",
    "schema:yearPublished": null
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

"schema:name": "古生物化石标本数据库",对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",如果该项为空则跳过该数据集

"schema:author":"陈焱森",对应\"nameZh\" : \"王杰\", "schema:author"如果为空则也为空

"dcat:byteSize": "123",,对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://geobiodiversity.com:8080/download/nigpas/nigpas.png
"@id": "http://doi.org/10.12091/fossil-ontology.20220707"中的fossil-ontology.20220707,对应"cstr": "18406.11.Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应cstr

"@id": "http://doi.org/10.12091/fossil-ontology.20220707"中的fossil-ontology.20220707,对应"doi": "10.11888/Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应doi

"downloadCount": NumberLong("2"),默认为 0

"fileNumber": NumberInt("1"),默认为 0

"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，全部设为空

"schema:keywords": "[ { \"@value\" : \"古生物化石\", \"@language\" : \"zh\" }, { \"@value\" : \"化石标本\", \"@language\" : \"zh\" }, { \"@value\" : \"fossil specimen occurrence\", \"@language\" : \"en\" }, { \"@value\" : \"fossil\", \"@language\" : \"en\" } ]"中的古生物化石、化石标本,对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"shareMode": "PUBLIC",全部设置为"shareMode": "PUBLIC"

"source": "国家青藏高原科学数据中心",全部设置为为 中国科学院南京地质古生物研究所数据中心

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"schema:version": "V1",,对应"version": "V1",

"dct:Subject": "{ \"@value\" : [ \"古生物学\" ], \"@type\" : \"GB/T 170-5041\" }"中的古生物学,对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

