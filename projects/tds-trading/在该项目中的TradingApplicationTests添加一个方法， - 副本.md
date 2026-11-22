在该项目中的TradingApplicationTests添加一个方法，

同步数据集，调用http://chemdc.casdc.cn/api/index/getIndexAllResourceByES，post请求，请求体body为

```json
{
    "aggregations": [
        {
            "field": "resourceType",
            "fieldType": "",
            "size": 10
        }
    ],
    "esParameter": [],
    "highlight": [
        {
            "color": "red",
            "highlightField": "name"
        },
        {
            "color": "red",
            "highlightField": "description"
        }
    ],
    "page": 0,
    "pageSize": 2,
    "sorts": [
        {
            "field": "approveTime",
            "fieldType": "",
            "order": "desc"
        }
    ]
}
```



返回值为

```json
{
    "message": "成功",
    "code": 200,
    "data": {
        "page": 0,
        "pageSize": 2,
        "total": 3498,
        "sourceList": [
            {
                "cstr": "32117.16.20250625.CN202510862430.2",
                "storageNum": 954977,
                "rootId": "39f1871350684505903d8727626759dd",
                "subject": [
                    "冶金技术"
                ],
                "description": "本申请公开了一种锂云母全粒级浮选捕收剂及其制备方法，属于矿物加工技术领域。本申请提供的浮选捕收剂，按重量份数计，其原料组成包括：改性脂肪胺10～40份，改性脂肪酸10～40份，有机碱5～30份，调整剂5～30份。制备方法包括以下步骤：步骤S1、将改性脂肪胺和改性脂肪酸置于反应器中，加热至20℃～70℃，搅拌1h～4h，制得混合物；步骤S2、在混合物中加入有机碱和调整剂，加热至50℃～70℃，搅拌1h～4h，制得锂云母全粒级浮选捕收剂。本申请所制得的浮选捕收剂具有耐泥高选择性，且能够适应不同粒度锂云母特点，简化浮选工艺，提高锂云母的整体回收率。",
                "fileCount": 1,
                "copyrightHolder": [
                    {
                        "@type": "Organization",
                        "name": "中国科学院过程工程研究所",
                        "@id": "8b9127bb180540099d4f5177c5843dd1"
                    }
                ],
                "id": "DV2FGZ0Bsqg0RX5Xh4rH",
                "subjectEn": [
                    "Metallurgical Technology"
                ],
                "approveTime": "2026-03-23",
                "ipc": [
                    "B03D1/004(2006.01)(浮选)"
                ],
                "fundingReferences": [
                    {
                        "fundType": "中国科学院-中国科学院战略性先导科技专项（C类）",
                        "identifier": "XDC0230100",
                        "@type": "Project",
                        "name": "流态化低温焙烧与氟资源化利用技术",
                        "@id": "686b944574570c69d8cb4b85"
                    }
                ],
                "publicationNumber": "CN120662458A",
                "author": [
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "中国科学院过程工程研究所",
                            "en_name": "Institute of process engineering",
                            "@id": "8b9127bb180540099d4f5177c5843dd1"
                        },
                        "@type": "Person",
                        "name": "李永利",
                        "en_name": "",
                        "@id": "ffe88ca8-dda0-4720-a558-a9246f8e88fd",
                        "email": "ylli@ipe.ac.cn"
                    },
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "中国科学院过程工程研究所数据中心",
                            "en_name": "Institute of process engineering",
                            "@id": "57d415348cb149ae9e15e42a5fd7a7fd"
                        },
                        "@type": "Person",
                        "name": "李会泉",
                        "en_name": "",
                        "@id": "5d7bfd52-defc-482c-bec0-824fdc21c3d6",
                        "email": "hqli@ipe.ac.cn"
                    },
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "中国科学院过程工程研究所",
                            "en_name": "Institute of process engineering",
                            "@id": "8b9127bb180540099d4f5177c5843dd1"
                        },
                        "@type": "Person",
                        "name": "郭强",
                        "en_name": "",
                        "@id": "651272ab93ecf136d687a9b5",
                        "email": "qguo@ipe.ac.cn"
                    },
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "中国科学院过程工程研究所数据中心",
                            "en_name": "Institute of process engineering",
                            "@id": "57d415348cb149ae9e15e42a5fd7a7fd"
                        },
                        "@type": "Person",
                        "name": "齐涛",
                        "en_name": "齐涛",
                        "@id": "2db69605-d5bc-4d88-90bb-c3783a0579b3",
                        "email": "tqi@ipe.ac.cn"
                    },
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "",
                            "@id": ""
                        },
                        "@type": "Person",
                        "name": "张灵",
                        "en_name": "",
                        "@id": "6512510293ecf136d687a938",
                        "email": "zhangling@ipe.ac.cn"
                    }
                ],
                "privacyPolicy": {
                    "type": "open"
                },
                "patentNumber": "CN202510862430.2",
                "versionFlag": "true",
                "follow": "no",
                "version": "V1",
                "suffixStorageNumNew": [
                    {
                        "storageNum": 954977,
                        "name": "pdf"
                    }
                ],
                "datePublished": "2025-09-19",
                "dateOfPatent": "2025-06-25",
                "useNewFilePath": "yes",
                "resourcesId": "4cc47a1514934004ae8350aafa7374e0",
                "createTime": "2026-01-27",
                "templateName": "中国科学院科学数据中心体系专利通用元数据（V 1.0）",
                "name": "一种锂云母全粒级浮选捕收剂及其制备方法",
                "resourceTypeName": "专利",
                "status": "adopt",
                "resourceType": "16",
                "fileFormatNew": [
                    {
                        "name": "pdf",
                        "count": 1
                    }
                ]
            },
            {
                "cstr": "36247.11.chemdc.j1AAPyCE",
                "storageNum": 197346897,
                "keywords": [
                    "化学物质",
                    "环境风险",
                    "工业污染控制"
                ],
                "rootId": "0ecbfeed340346299d3977a79a3d4619",
                "subject": [
                    "环境毒理学"
                ],
                "description": "化学物质环境风险数据主要面向我国重点工业污染防治与重点污染物及新污染物控制的重大需求，依据主要工业国家优控污染物清单、新污染物清单、我国九类重点工业全流程涉及到的化学物质以及中国现有化学物质名录（IECSC）进行化学物质筛选，依此已经筛选出4000余种重点化学物质。数据集主要内容包括①重点工业化学物质行业信息及分类信息；②重点工业化学物质的基础信息；③重点工业化学物质基本理化性质信息；④重点工业化学物质的毒理性质；⑤重点工业化学物质环境风险信息；⑥重点工业化学物质安全信息；（7）重点工业化学物质使用和管理信息。数据集可用于环境保护监管及相应政策制定、科学研究、企业管理与风险控制、公众教育与信息披露。",
                "fileCount": 6078,
                "id": "Cl1995sBsqg0RX5Xe4o6",
                "subjectEn": [
                    "Environmental Toxicology"
                ],
                "approveTime": "2026-01-26",
                "image": true,
                "dataSetLogoUrl": "/api/datasetLogo/2026/0ecbfeed340346299d3977a79a3d4619.png",
                "author": [
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "",
                            "@id": ""
                        },
                        "@type": "Person",
                        "name": "熊梅",
                        "en_name": "",
                        "@id": "65d57b68ed49a6442dd25d98",
                        "email": "xiongmei3344@163.com"
                    },
                    {
                        "Organization": {
                            "@type": "Organization",
                            "name": "",
                            "@id": ""
                        },
                        "@type": "Person",
                        "name": "赵月红",
                        "en_name": "",
                        "@id": "5475c4d9838340ab9d6fc0b735f01942"
                    }
                ],
                "privacyPolicy": {
                    "condition": "获得课题负责人许可（xiongmei3344@163.com）",
                    "type": "condition"
                },
                "description_en": null,
                "versionFlag": "true",
                "follow": "no",
                "version": "V1",
                "suffixStorageNumNew": [
                    {
                        "storageNum": 117250262,
                        "name": "pptx"
                    },
                    {
                        "storageNum": 77952527,
                        "name": "xlsx"
                    },
                    {
                        "storageNum": 22848,
                        "name": "txt"
                    },
                    {
                        "storageNum": 2084958,
                        "name": "csv"
                    },
                    {
                        "storageNum": 36302,
                        "name": "docx"
                    }
                ],
                "license": "CC BY 4.0",
                "useNewFilePath": "yes",
                "resourcesId": "261b31aa14704d418116628b5d8a5a1e",
                "createTime": "2026-01-26",
                "templateName": "中国科学院科学数据中心体系数据集通用元数据（V 1.0）",
                "name": "化学物质环境风险数据库",
                "keywords_en": [],
                "resourceTypeName": "数据集",
                "name_en": null,
                "doi": "10.57841/casdc.0007094",
                "status": "adopt",
                "resourceType": "11",
                "fileFormatNew": [
                    {
                        "name": "pptx",
                        "count": 1
                    },
                    {
                        "name": "xlsx",
                        "count": 4144
                    },
                    {
                        "name": "txt",
                        "count": 1
                    },
                    {
                        "name": "csv",
                        "count": 1931
                    },
                    {
                        "name": "docx",
                        "count": 1
                    }
                ]
            }
        ]
    },
    "count": null
}
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

 "name": "一种锂云母全粒级浮选捕收剂及其制备方法",对应"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",

"name": "李永利",对应\"nameZh\" : \"王杰\", \"nameEn\" : \"王杰\",

"storageNum": 954977,对应"byteSize": "1707249500",

"count": NumberLong("0"),默认为 0

"coverUrl": "https://data.tpdc.ac.cn/file/file/downloadFile?fileKey=2&fileId=5958617b-77c5-484b-8697-88f1484a3c23",默认为 http://chemdc.casdc.cn/api/banaer_icoLogo/66a428c7fd0242e6858815446c12055eicoLogo.png
"cstr": "32117.16.20250625.CN202510862430.2",对应"cstr": "18406.11.Atmos.tpdc.303450",

"cstr": "32117.16.20250625.CN202510862430.2",对应"doi": "10.11888/Atmos.tpdc.303450",

"downloadCount": NumberLong("2"),默认为 0

"fileNumber": NumberInt("1"),默认为 0

"description": "本申请公开了一种锂云母全粒级浮选捕收剂及其制备方法，属于矿物加工技术领域。本申请提供的浮选捕收剂，按重量份数计，其原料组成包括：改性脂肪胺10～40份，改性脂肪酸10～40份，有机碱5～30份，调整剂5～30份。制备方法包括以下步骤：步骤S1、将改性脂肪胺和改性脂肪酸置于反应器中，加热至20℃～70℃，搅拌1h～4h，制得混合物；步骤S2、在混合物中加入有机碱和调整剂，加热至50℃～70℃，搅拌1h～4h，制得锂云母全粒级浮选捕收剂。本申请所制得的浮选捕收剂具有耐泥高选择性，且能够适应不同粒度锂云母特点，简化浮选工艺，提高锂云母的整体回收率。",对应"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。"，

"keywords": [
                    "化学物质",
                    "环境风险",
                    "工业污染控制"
                ],对应"keywordsZh": "[\\"温度\\";\\"降水\\";\\"风\\" ]",

"privacyPolicy": {
                    "type": "open"
                },对应"shareMode": "PUBLIC",

"privacyPolicy": {
                    "type": "condition"
                },对应"shareMode": "PRIVATE",

"source": "国家青藏高原科学数据中心",默认为 中国科学院化学化工科学数据中心

"status": NumberInt("9"),默认为 9

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),默认为当前时间

"version": "V1",对应"version": "V1",

"subject": [
                    "冶金技术"
                ],对应"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",其中code和nameEn可以为空

