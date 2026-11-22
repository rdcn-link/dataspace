在该项目中的TradingApplicationTests添加一个方法，同步数据集，读取一个json文件，
示例为

```json
[
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"dcat\" : \"http://www.w3.org/ns/dcat#\", \"@language\" : \"zh\" }",
    "@id": "https://doi.org/",
    "@type": "dcmi:Dataset",
    "casdc:dateAvailable": null,
    "casdc:fileNumber": "3",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdAccessRights": null,
    "casdc:sensitiveContent": "yes",
    "code": null,
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "1021042",
    "dct:fundingReferences": null,
    "dct:Subject": "{ \"@value\" : [ \"水资源保护\", \"水环境评价）\", \"生态系统生态学\", \"水生生态学与湖泊生态学\", \"群落生态学\" ], \"@type\" : \"GB/T\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_16ec",
    "message": null,
    "schema:author": "[ { \"@list\" : [ { \"@type\" : \"schema:Person\", \"schema:name\" : null, \"schema:email\" : null } ] } ]",
    "schema:citation": null,
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:dataAvailabilityStatement": null,
    "schema:dateCreated": null,
    "schema:datePublished": "2022-10-19T17:18:45+08:00",
    "schema:description": "[ { \"@value\" : \"数据集为2016年在深圳茅洲河流域开展的水生态系统调查与河湖健康评估数据，包含有浮游植物、浮游动物、底栖动物的物种组成、密度、生物量以及多样性数据。\", \"@language\" : \"zh\" } ]",
    "schema:identifier": "[ { \"@type\" : \"dct:DOI\", \"@id\" : \"https://doi.org/\" }, { \"@type\" : \"https://www.iana.org/assignments/uri-schemes/prov/cstr\", \"@id\" : \"https://cstr.cn/39844.11.ihbdc.GXabdSI1\" } ]",
    "schema:image": null,
    "schema:ISBN": null,
    "schema:isPartOf": null,
    "schema:issn": null,
    "schema:issueNumber": null,
    "schema:keywords": "[ { \"@value\" : \"茅洲河流域\", \"@language\" : \"zh\" }, { \"@value\" : \"水生态\", \"@language\" : \"zh\" }, { \"@value\" : \"河湖健康\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    "schema:name": "[ { \"@value\" : \"茅洲河流域水生态系统调查与河流健康评估\", \"@language\" : \"zh\" } ]",
    "schema:pageEnd": null,
    "schema:pageStart": null,
    "schema:patentNumber": null,
    "schema:provider": null,
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn/39844\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院水生生物研究所所级中心\" }",
    "schema:references": null,
    "schema:relatedDataset": null,
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs\", \"schema:logo\" : \"http://sdb.ihb.ac.cn/api/banaer_icoLogo/856ee15ba4ad43808c2adeeb8c3d713d.png\", \"schema:name\" : \"中国科学院水生生物研究所所级中心\" }",
    "schema:url": "http://sdb.ihb.ac.cn/dataDetails/d8a1b28c41794d2684a257a732a9a88b",
    "schema:version": "V1",
    "schema:versions": null,
    "schema:volumeNumber": null,
    "schema:yearPublished": null
  },
  {
    "@context": "{ \"casdc\" : \"http://casdc.cn/md/\", \"schema\" : \"https://schema.org/\", \"xsd\" : \"http://www.w3.org/2001/XMLSchema#\", \"dc\" : \"http://purl.org/dc/elements/1.1/\", \"dcmi\" : \"http://purl.org/dc/dcmitype/\", \"dct\" : \"http://datacite.org/schema/kernel-4/\", \"dcterms\" : \"http://purl.org/dc/terms/\", \"dcat\" : \"http://www.w3.org/ns/dcat#\", \"@language\" : \"zh\" }",
    "@id": "https://www.doi.org/10.3969/j.issn.1003-6504.2013.6L.013",
    "@type": "dcmi:Dataset",
    "casdc:dateAvailable": null,
    "casdc:fileNumber": "2",
    "casdc:originalStatement": "yes",
    "casdc:privacyProtection": "yes",
    "casdc:sdAccessRights": null,
    "casdc:sensitiveContent": "yes",
    "code": null,
    "dc:type": "dcmi:Dataset",
    "dcat:byteSize": "1407798",
    "dct:fundingReferences": null,
    "dct:Subject": "{ \"@value\" : [ \"水生生态学与湖泊生态学\", \"群落生态学\" ], \"@type\" : \"GB/T 13745-2009\" }",
    "dcterms:accessRights": "http://purl.org/coar/access_right/c_16ec",
    "message": null,
    "schema:author": "[ { \"@list\" : [ { \"@type\" : \"schema:Person\", \"schema:name\" : null, \"schema:email\" : null } ] } ]",
    "schema:citation": null,
    "schema:creativeWorkStatus": "http://purl.org/coar/version/c_970fb48d4fbd8a85",
    "schema:dataAvailabilityStatement": null,
    "schema:dateCreated": null,
    "schema:datePublished": "2022-10-19T10:00:21+08:00",
    "schema:description": "浮游植物的密度、组成及其分布模式是大型水库营养状态和污染程度的重要指示参数。本数据集为2011年8月黄河黄河小浪底水库与东平湖的浮游植物分布，浮游植物密度，浮游植物生物量数据",
    "schema:identifier": "[ { \"@type\" : \"dct:DOI\", \"@id\" : \"https://www.doi.org/10.3969/j.issn.1003-6504.2013.6L.013\" }, { \"@type\" : \"https://www.iana.org/assignments/uri-schemes/prov/cstr\", \"@id\" : \"https://cstr.cn/39844.11.ihbdc.yvDNGWTe\" } ]",
    "schema:image": null,
    "schema:ISBN": null,
    "schema:isPartOf": null,
    "schema:issn": null,
    "schema:issueNumber": null,
    "schema:keywords": "[ { \"@value\" : \"浮游植物\", \"@language\" : \"zh\" }, { \"@value\" : \"东平湖\", \"@language\" : \"zh\" }, { \"@value\" : \"小浪底水库\", \"@language\" : \"zh\" } ]",
    "schema:license": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    "schema:name": "2011年8月黄河藻类数据集",
    "schema:pageEnd": null,
    "schema:pageStart": null,
    "schema:patentNumber": null,
    "schema:provider": null,
    "schema:publisher": "{ \"@id\" : \"https://cstr.cn/39844\", \"@type\" : \"casdc:Organization\", \"schema:name\" : \"中国科学院水生生物研究所所级中心\" }",
    "schema:references": null,
    "schema:relatedDataset": null,
    "schema:sourceOrganization": "{ \"@id\" : \"http://semweb.casdc.cn/resource/casorgs\", \"schema:logo\" : \"http://sdb.ihb.ac.cn/api/banaer_icoLogo/856ee15ba4ad43808c2adeeb8c3d713d.png\", \"schema:name\" : \"中国科学院水生生物研究所所级中心\" }",
    "schema:url": "http://sdb.ihb.ac.cn/dataDetails/523405355cf04158ad49a233af2f1026",
    "schema:version": "V1",
    "schema:versions": null,
    "schema:volumeNumber": null,
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

"schema:name": "2011年8月黄河藻类数据集",对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",如果该项为空则跳过该数据集

"schema:author":"陈焱森",对应\"nameZh\" : \"王杰\","schema:author"如果为空则也为空

"dcat:byteSize": "717388",对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://datacenter.kiz.ac.cn/Content/images/top_title.jpg
"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"cstr": "18406.11.Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应cstr

"@id": "18406.11.ECOLO.TPDC.270374",中的18406.11.ECOLO.TPDC.270374,对应"doi": "10.11888/Atmos.tpdc.303450",注意也存在"@id": "https://cstr.cn/35614.11.NIGPAS.Ur2IxdQa",中的35614.11.NIGPAS.Ur2IxdQa对应doi

"downloadCount": NumberLong("2"),默认为 0

"casdc:fileNumber": "3",对应"fileNumber": NumberInt("1")

"schema:description": "[ { \"@value\" : \"藏族人群如何适应高原极端环境目前还并不清楚。而代谢作为重要的表型，在保持个体正常生物学功能中发挥了重要作用，已有研究表明一些代谢小分子可以通过调控能量代谢、氧化应激等生物学过程以适应外界的极端环境。鉴于此，项目通过研究藏族人群相比平原人群的特有的代谢特征，有望发现人体代谢与极端环境适应的关系，进而以代谢的视角研究藏族人群的高原适应机制。该数据是项目实施过程中产生的代谢组数据，目前的数据包括了30例平原人群的代谢组数据；利用这批数据与后续的代谢组数据进行联合分析，可以用来研究高原藏族人群在高原低氧环境下的代谢特征。\", \"@language\" : \"zh\" } ]",对应"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，"schema:description"如果为空则也为空

"schema:keywords": "[ { \"@value\" : \"茅洲河流域\", \"@language\" : \"zh\" }, { \"@value\" : \"水生态\", \"@language\" : \"zh\" }, { \"@value\" : \"河湖健康\", \"@language\" : \"zh\" } ]",中的茅洲河流域、水生态、河湖健康,对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"shareMode": "PUBLIC",全部设置为"shareMode": "PUBLIC"

"source": "国家青藏高原科学数据中心",全部设置为中国科学院水生生物研究所科学数据中心

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"schema:version": "V1",,对应"version": "V1",

 "dct:Subject": "{ \"@value\" : [ \"水资源保护\", \"水环境评价）\", \"生态系统生态学\", \"水生生态学与湖泊生态学\", \"群落生态学\" ], \"@type\" : \"GB/T\" }",中的藏族人群；古人类,对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

