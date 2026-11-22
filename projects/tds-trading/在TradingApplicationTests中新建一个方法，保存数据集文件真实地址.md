### 在TradingApplicationTests中新建一个方法，保存数据集文件真实地址

首先调用https://www.scidb.cn/oai?verb=ListRecords&metadataPrefix=oai_datacite，get请求

返回值为

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/static/oaitohtml.xsl"?>
<!--
<?xml-stylesheet type="text/xsl" href="/oaitohtml.xsl"?>
-->
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <responseDate>2026-09-11T10:42:14Z</responseDate>
    <request verb="ListRecords" metadataPrefix="oai_datacite" >https://www.scidb.cn/oai</request>
    <ListRecords>
        <record>
            <header >
                <identifier>10.57760/sciencedb.010wk</identifier>
                <datestamp>2026-09-11T10:30:44Z</datestamp>
            </header>
            <metadata>
                <resource xmlns="http://datacite.org/schema/kernel-4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
                    <identifier identifierType="DOI">10.57760/sciencedb.010wk</identifier>
                    <alternateIdentifiers>
                        <alternateIdentifier alternateIdentifierType="CSTR">31253.11.sciencedb.010wk</alternateIdentifier>
                        <alternateIdentifier alternateIdentifierType="datasetId">de2bb704e6f047a38a5b84ac6614d592</alternateIdentifier>
                    </alternateIdentifiers>
                    <creators>
                        <creator>
                            <creatorName>Xing Shang</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/02wmsc916" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Guizhou University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Yu Chen</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/02wmsc916" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Guizhou University</affiliation>
                        </creator>
                    </creators>
                    <titles>
                        <title>ABIDE Subject ID Dataset Used for Triple-Network BrainAGE Analysis in Autism Spectrum Disorder</title>
                        <title xml:lang="zh">孤独症谱系障碍三网络BrainAGE分析所用ABIDE受试者编号数据集</title>
                    </titles>
                    <publisher>Science Data Bank</publisher>
                    <publicationYear>2026</publicationYear>
                    <subjects>
                        <subject classificationCode="18047" subjectScheme="GB/T 13745-2009">Neurobiology</subject>
                        <subject>autism spectrum disorder</subject>
                        <subject>structural magnetic resonance imaging</subject>
                        <subject>triple-network system</subject>
                    </subjects>
                    <dates>
                        <date dateType="Issued">2026-09-07</date>
                        <date dateType="Created">2026-08-30</date>
                        <date dateType="Updated">2026-09-11</date>
                    </dates>
                    <language>zh</language>
                    <resourceType resourceTypeGeneral="Dataset">Dataset</resourceType>
                    <version>V2</version>
                    <rightsList>
                        <rights rightsURI="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</rights>
                        <rights rightsURI="https://vocabularies.coar-repositories.org/access_rights/c_abf2/">open access</rights>
                    </rightsList>
                    <descriptions>
                        <description descriptionType="Abstract">This dataset contains the associated data for the article &amp;ldquo;Differential Structural Maturation Trajectories of the Triple Network System in Autism Spectrum Disorder,&amp;rdquo; including the identifiers of the ABIDE participants included in the study and the structural MRI-derived data obtained after VBM preprocessing and used for subsequent analyses. The original structural MRI data were obtained from the publicly available Autism Brain Imaging Data Exchange (ABIDE) database and are not redistributed in this dataset. These associated data are provided to support verification and reproducibility of the analyses reported in the article. The original imaging data can be accessed through the ABIDE database in accordance with its data-access and data-use policies.</description>
                        <description descriptionType="Abstract" xml:lang="zh">本数据集为论文《孤独症谱系障碍三网络系统脑结构异常发育模式研究》的关联数据，包括本研究实际纳入分析的Autism Brain Imaging Data Exchange（ABIDE）受试者编号以及经VBM流程预处理后用于后续分析的结构磁共振衍生数据。原始结构磁共振影像数据来源于公开的ABIDE数据库，本数据集不重新发布ABIDE原始影像数据。所提供的数据用于支持本文相关分析结果的复现与核查。原始影像数据可按照ABIDE数据库的数据访问和使用规定获取。</description>
                    </descriptions>
                    <sizes>
                        <size>2022365816 bytes</size>
                        <size>290 files</size>
                    </sizes>
                </resource>
            </metadata>
        </record>
        <record>
            <header >
                <identifier>10.57760/sciencedb.0129b</identifier>
                <datestamp>2026-09-11T10:30:42Z</datestamp>
            </header>
            <metadata>
                <resource xmlns="http://datacite.org/schema/kernel-4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
                    <identifier identifierType="DOI">10.57760/sciencedb.0129b</identifier>
                    <alternateIdentifiers>
                        <alternateIdentifier alternateIdentifierType="CSTR">31253.11.sciencedb.0129b</alternateIdentifier>
                        <alternateIdentifier alternateIdentifierType="datasetId">1169d7a45d564fe580ef3897ef276129</alternateIdentifier>
                    </alternateIdentifiers>
                    <creators>
                        <creator>
                            <creatorName>Chenxi Li</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/022k4wk35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Beijing Normal University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Leran Wang</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/02n96ep67" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">East China Normal University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Haoqi Wen</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/022k4wk35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Beijing Normal University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Yuhao Jiang</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/022k4wk35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Beijing Normal University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Runze Liao</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/022k4wk35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Beijing Normal University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Yaping Luo</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/04jztag35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Chinese Academy of Medical Sciences and Peking Union Medical College Hospital</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Boxuan Shi</creatorName>
                            <affiliation>China Institute for Radiation Protection</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Jianyong Jiang</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/022k4wk35" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Beijing Normal University</affiliation>
                        </creator>
                    </creators>
                    <titles>
                        <title>Towards the Limits of Spatial Resolution in Preclinical PET: Prototype Validation and High-Sensitivity Dual-Layer Extension</title>
                        <title xml:lang="zh">Towards the Limits of Spatial Resolution in Preclinical PET: Prototype Validation and High-Sensitivity Dual-Layer Extension</title>
                    </titles>
                    <publisher>Science Data Bank</publisher>
                    <publicationYear>2026</publicationYear>
                    <subjects>
                        <subject classificationCode="490" subjectScheme="GB/T 13745-2009">Nuclear science and technology</subject>
                        <subject>Positron emission tomography</subject>
                        <subject>high-resolution imaging</subject>
                        <subject>depth-of-interaction</subject>
                        <subject>instrumentation</subject>
                    </subjects>
                    <dates>
                        <date dateType="Issued">2026-09-11</date>
                        <date dateType="Created">2026-09-10</date>
                        <date dateType="Updated">2026-09-11</date>
                    </dates>
                    <language>en</language>
                    <resourceType resourceTypeGeneral="Dataset">Dataset</resourceType>
                    <version>V1</version>
                    <rightsList>
                        <rights rightsURI="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</rights>
                        <rights rightsURI="https://vocabularies.coar-repositories.org/access_rights/c_abf2/">open access</rights>
                    </rightsList>
                    <descriptions>
                        <description descriptionType="Abstract">	High spatial resolution and sensitivity are paramount in preclinical positron emission tomography (PET). Thicker scintillators improve detection efficiency but increase depth-of-interaction (DOI) parallax, whereas thinner scintillators reduce depth uncertainty at the expense of sensitivity. We developed and experimentally evaluated a compact PET scanner utilizing 0.579-mm-pitch, 5-mm-thick lutetium yttrium orthosilicate (LYSO) crystal arrays (0.497 &amp;times; 0.497 &amp;times; 5 mm3) and investigated a higher-sensitivity dual-layer architecture with discrete DOI encoding through simulation. The prototype achieved an energy resolution (full width at half maximum, FWHM) of 13.43% &amp;plusmn; 1.95% at 511 keV, a peak sensitivity of 0.87% (350&amp;ndash;650 keV window), a peak noise-equivalent count rate of 6.02 kcps, and a scatter fraction of 8.92%. Filtered back-projection yielded mean radial, tangential, and axial spatial resolutions (FWHM) of 0.90, 0.86, and 0.69 mm, respectively, reaching a minimum axial FWHM of 0.48 mm. Micro-Derenzo phantom imaging demonstrated sub-0.5-mm contrast modulation, with mean peak-to-valley ratios of 1.65 and 1.48 for the 0.45- and 0.40-mm rod sectors. In 18F-NaF murine imaging, the computed tomography (CT)-referenced structural similarity index was 0.79, versus 0.67 for a commercial scanner. Three configurations retained the prototype as the inner-layer detector ring, adding outer crystals with thicknesses of 5, 7.5, or 10 mm, and expanded axial coverage. Simulated peak sensitivity increased monotonically to 3.10%, 4.27%, and 5.36% (up to a 4.36&amp;times; gain over the baseline), while spatial resolution degradation remained constrained due to a high fraction (71.1%&amp;ndash;85.7%) of coincidences retaining inner-layer interaction endpoints. These results validate the prototype&amp;rsquo;s state-of-the-art spatial resolution and establish a viable architectural blueprint for next-generation DOI-PET systems.</description>
                        <description descriptionType="Abstract" xml:lang="zh">	High spatial resolution and sensitivity are paramount in preclinical positron emission tomography (PET). Thicker scintillators improve detection efficiency but increase depth-of-interaction (DOI) parallax, whereas thinner scintillators reduce depth uncertainty at the expense of sensitivity. We developed and experimentally evaluated a compact PET scanner utilizing 0.579-mm-pitch, 5-mm-thick lutetium yttrium orthosilicate (LYSO) crystal arrays (0.497 &amp;times; 0.497 &amp;times; 5 mm3) and investigated a higher-sensitivity dual-layer architecture with discrete DOI encoding through simulation. The prototype achieved an energy resolution (full width at half maximum, FWHM) of 13.43% &amp;plusmn; 1.95% at 511 keV, a peak sensitivity of 0.87% (350&amp;ndash;650 keV window), a peak noise-equivalent count rate of 6.02 kcps, and a scatter fraction of 8.92%. Filtered back-projection yielded mean radial, tangential, and axial spatial resolutions (FWHM) of 0.90, 0.86, and 0.69 mm, respectively, reaching a minimum axial FWHM of 0.48 mm. Micro-Derenzo phantom imaging demonstrated sub-0.5-mm contrast modulation, with mean peak-to-valley ratios of 1.65 and 1.48 for the 0.45- and 0.40-mm rod sectors. In 18F-NaF murine imaging, the computed tomography (CT)-referenced structural similarity index was 0.79, versus 0.67 for a commercial scanner. Three configurations retained the prototype as the inner-layer detector ring, adding outer crystals with thicknesses of 5, 7.5, or 10 mm, and expanded axial coverage. Simulated peak sensitivity increased monotonically to 3.10%, 4.27%, and 5.36% (up to a 4.36&amp;times; gain over the baseline), while spatial resolution degradation remained constrained due to a high fraction (71.1%&amp;ndash;85.7%) of coincidences retaining inner-layer interaction endpoints. These results validate the prototype&amp;rsquo;s state-of-the-art spatial resolution and establish a viable architectural blueprint for next-generation DOI-PET systems.</description>
                    </descriptions>
                    <sizes>
                        <size>310018184 bytes</size>
                        <size>2001 files</size>
                    </sizes>
                </resource>
            </metadata>
        </record>
        <record>
        ...
        </record>
        <resumptionToken completeListSize="26703">
eyJjdXJzb3IiOjUwLCJtZXRhZGF0YVByZWZpeCI6Im9haV9kYXRhY2l0ZSIsImNvbXBsZXRlTGlzdFNpemUiOjI2NzAzfQ==
</resumptionToken>
    </ListRecords>
</OAI-PMH>
```

<alternateIdentifier alternateIdentifierType="datasetId">de2bb704e6f047a38a5b84ac6614d592</alternateIdentifier>
                    </alternateIdentifiers>
<version>V2</version>

返回值中的datasetId：de2bb704e6f047a38a5b84ac6614d592和version：V2作为下一个接口的参数，





将这个返回值，存储为dataset，
例如

```xml
<record>
            <header >
                <identifier>10.57760/sciencedb.010wk</identifier>
                <datestamp>2026-09-11T10:30:44Z</datestamp>
            </header>
            <metadata>
                <resource xmlns="http://datacite.org/schema/kernel-4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
                    <identifier identifierType="DOI">10.57760/sciencedb.010wk</identifier>
                    <alternateIdentifiers>
                        <alternateIdentifier alternateIdentifierType="CSTR">31253.11.sciencedb.010wk</alternateIdentifier>
                        <alternateIdentifier alternateIdentifierType="datasetId">de2bb704e6f047a38a5b84ac6614d592</alternateIdentifier>
                    </alternateIdentifiers>
                    <creators>
                        <creator>
                            <creatorName>Xing Shang</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/02wmsc916" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Guizhou University</affiliation>
                        </creator>
                        <creator>
                            <creatorName>Yu Chen</creatorName>
                            <affiliation affiliationIdentifier="https://ror.org/02wmsc916" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">Guizhou University</affiliation>
                        </creator>
                    </creators>
                    <titles>
                        <title>ABIDE Subject ID Dataset Used for Triple-Network BrainAGE Analysis in Autism Spectrum Disorder</title>
                        <title xml:lang="zh">孤独症谱系障碍三网络BrainAGE分析所用ABIDE受试者编号数据集</title>
                    </titles>
                    <publisher>Science Data Bank</publisher>
                    <publicationYear>2026</publicationYear>
                    <subjects>
                        <subject classificationCode="18047" subjectScheme="GB/T 13745-2009">Neurobiology</subject>
                        <subject>autism spectrum disorder</subject>
                        <subject>structural magnetic resonance imaging</subject>
                        <subject>triple-network system</subject>
                    </subjects>
                    <dates>
                        <date dateType="Issued">2026-09-07</date>
                        <date dateType="Created">2026-08-30</date>
                        <date dateType="Updated">2026-09-11</date>
                    </dates>
                    <language>zh</language>
                    <resourceType resourceTypeGeneral="Dataset">Dataset</resourceType>
                    <version>V2</version>
                    <rightsList>
                        <rights rightsURI="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</rights>
                        <rights rightsURI="https://vocabularies.coar-repositories.org/access_rights/c_abf2/">open access</rights>
                    </rightsList>
                    <descriptions>
                        <description descriptionType="Abstract">This dataset contains the associated data for the article &amp;ldquo;Differential Structural Maturation Trajectories of the Triple Network System in Autism Spectrum Disorder,&amp;rdquo; including the identifiers of the ABIDE participants included in the study and the structural MRI-derived data obtained after VBM preprocessing and used for subsequent analyses. The original structural MRI data were obtained from the publicly available Autism Brain Imaging Data Exchange (ABIDE) database and are not redistributed in this dataset. These associated data are provided to support verification and reproducibility of the analyses reported in the article. The original imaging data can be accessed through the ABIDE database in accordance with its data-access and data-use policies.</description>
                        <description descriptionType="Abstract" xml:lang="zh">本数据集为论文《孤独症谱系障碍三网络系统脑结构异常发育模式研究》的关联数据，包括本研究实际纳入分析的Autism Brain Imaging Data Exchange（ABIDE）受试者编号以及经VBM流程预处理后用于后续分析的结构磁共振衍生数据。原始结构磁共振影像数据来源于公开的ABIDE数据库，本数据集不重新发布ABIDE原始影像数据。所提供的数据用于支持本文相关分析结果的复现与核查。原始影像数据可按照ABIDE数据库的数据访问和使用规定获取。</description>
                    </descriptions>
                    <sizes>
                        <size>2022365816 bytes</size>
                        <size>290 files</size>
                    </sizes>
                </resource>
            </metadata>
        </record>
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
    "downloadCount": NumberLong("0"),
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
    "viewCount": NumberLong("0")
}

```

要求

Yu Chen对应 王杰
"byteSize": "1707249500",对应 2022365816
"count": NumberLong("0")不变

"coverUrl"为"",

"cstr": "18406.11.Atmos.tpdc.303450",对应 31253.11.sciencedb.010wk

"dataSetId": null,对应 de2bb704e6f047a38a5b84ac6614d592

"doi": "10.11888/Atmos.tpdc.303450",对应 10.57760/sciencedb.010wk

"downloadCount": NumberLong("0"),不变

"fileNumber": NumberInt("1"),对应 290

"introductionEh": null,不变

"introductionZh": "黄河源校正气象数据集是为了解决黄河源缺乏长序列高质量气象数据集所开发的一套气象数据集。本数据集包含黄河源地区降水、最高气温、最低气温、平均风速5个气象要素共计74年数据(1951-2024)，空间范围覆盖 （95.8°E~103.5°E，32.1°N~36.2°N ）。数据集主要是基于站点观测数据通过对比CMFD，CMFDv2.0，CN05.1，ERA5-Land和TMPFD 共计5种网格化数据集筛选出表现较佳的气象数据集，而后采用统计降尺度纠正长序列气象数据集（CMFDv2.0）获得。站点结果对比显示校正数据集具有更好的相关性和更低的系统偏差。数据集可为黄河源的水文气象预报提供支撑。",对应 本数据集为论文《孤独症谱系障碍三网络系统脑结构异常发育模式研究》的关联数据，包括本研究实际纳入分析的Autism Brain Imaging Data Exchange（ABIDE）受试者编号以及经VBM流程预处理后用于后续分析的结构磁共振衍生数据。原始结构磁共振影像数据来源于公开的ABIDE数据库，本数据集不重新发布ABIDE原始影像数据。所提供的数据用于支持本文相关分析结果的复现与核查。原始影像数据可按照ABIDE数据库的数据访问和使用规定获取。
"keywordsEn": "[ \"temperature\";\"precipitation\";\"Wind\" ]",为""

"keywordsZh": "[ \"温度\";\"降水\";\"风\" ]",为""

"shareMode": "PUBLIC",不变

"source": "国家青藏高原科学数据中心",为 科学数据银行

"status": NumberInt("9"),不变

"subject": "[ { \"code\" : \"170\", \"nameZh\" : \"地球科学\", \"nameEn\" : \"Earth science\" } ]",为""

"titleEn": "Daily 0.1 ° corrected meteorological dataset for the Yellow River source (1951-2024)",对应 ABIDE Subject ID Dataset Used for Triple-Network BrainAGE Analysis in Autism Spectrum Disorder

"titleZh": "黄河源逐日0.1°校正气象数据集（1951-2024）",对应 孤独症谱系障碍三网络BrainAGE分析所用ABIDE受试者编号数据集

"updateAt": ISODate("2026-04-22T03:13:08.000Z"),为 当前时间

"version": "V1",不变

"viewCount": NumberLong("0")不变

dataset在mongdb中名称为tds-dataset，实体类在E:\project\common\src\main\java\cn\tds\common\domain\DataSet.java

Repository为E:\project\tds-trading\src\main\java\cn\tds\trading\repository\DataSetRepository.java











再调用https://www.scidb.cn/api/gin-sdb-filetree/public/file/childrenFileListByPath接口，post请求，请求体为
```json
{"dataSetId":"de2bb704e6f047a38a5b84ac6614d592","version":"V2","path":"/V2","lastIndex":0,"pageSize":200}
```

其中dataSetId为

<alternateIdentifier alternateIdentifierType="datasetId">de2bb704e6f047a38a5b84ac6614d592</alternateIdentifier>
                    </alternateIdentifiers>中的参数

"version":"V2","path":"/V2"为<version>V2</version>中的参数

接口返回值为

```json
{
    "code": 20000,
    "message": "成功",
    "messageEn": "Success",
    "data": [
        {
            "id": "e9438b2d6644538ec4b7ee2cfad75494",
            "datasetId": "de2bb704e6f047a38a5b84ac6614d592",
            "version": "V2",
            "fcstr": "",
            "fileName": "VBMed_data",
            "path": "/V2/VBMed_data",
            "md5": "",
            "suffix": "",
            "size": 0,
            "dir": true,
            "link": false,
            "url": "",
            "from": "",
            "accountId": "",
            "canPreview": false,
            "canBot": false,
            "md5ToCompute": false,
            "mod": 667,
            "createTime": "2026-09-10T10:16:48+08:00",
            "modifyTime": "2026-09-10T10:30:13+08:00",
            "index": 0,
            "parentFileCount": 2,
            "children": []
        },
        {
            "id": "51d4bc0a86bccf2f0f8e554fdfc33b46",
            "datasetId": "de2bb704e6f047a38a5b84ac6614d592",
            "version": "V2",
            "fcstr": "31253.11.sciencedb.010wk.01F4D42E.V2",
            "fileName": "本研究使用的ABIDE受试者编号.docx",
            "path": "/V2/本研究使用的ABIDE受试者编号.docx",
            "md5": "da3b5f4aadb9dcc008f7622fef49ab70",
            "suffix": "docx",
            "size": 12020,
            "dir": false,
            "link": false,
            "url": "",
            "from": "http",
            "accountId": "",
            "canPreview": true,
            "canBot": false,
            "md5ToCompute": false,
            "mod": 667,
            "createTime": "2026-09-10T01:43:25.989Z",
            "modifyTime": "2026-09-10T01:43:25.989Z",
            "index": 1,
            "parentFileCount": 2
        }
    ]
}
```

其中，"fileName": "本研究使用的ABIDE受试者编号.docx",说明这是一个文件，那么携带该id调用https://www.scidb.cn/api/gin-sdb-filetree/public/file/getBlobByFileId?fileId=51d4bc0a86bccf2f0f8e554fdfc33b46
返回值为

```json
{
    "code": 20000,
    "message": "成功",
    "messageEn": "Success",
    "data": {
        "id": "da3b5f4aadb9dcc008f7622fef49ab70_12020",
        "location": "/mnt/sciencedbNew/dataSet/da3/b5f/4aa/db9dcc008f7622fef49ab70/12020.docx",
        "md5": "da3b5f4aadb9dcc008f7622fef49ab70",
        "size": 12020
    }
}
```

其中"location": "/mnt/sciencedbNew/dataSet/da3/b5f/4aa/db9dcc008f7622fef49ab70/12020.docx",为真实地址，需要保存下来。

另一个"path": "/V2/VBMed_data",,说明这是一个文件夹，那么修改https://www.scidb.cn/api/gin-sdb-filetree/public/file/childrenFileListByPath的请求体中的path{"dataSetId":"de2bb704e6f047a38a5b84ac6614d592","version":"V2","path":"/V2/VBMed_data","lastIndex":0,"pageSize":200}
返回值为

```json
{
    "code": 20000,
    "message": "成功",
    "messageEn": "Success",
    "data": [
        {
            "id": "13c7fdc27b68e9deb7f85c42b1d82e18",
            "datasetId": "de2bb704e6f047a38a5b84ac6614d592",
            "version": "V2",
            "fcstr": "31253.11.sciencedb.010wk.01CA1FD1",
            "fileName": "mwp129150.nii",
            "path": "/V2/VBMed_data/mwp129150.nii",
            "md5": "c1e247a2044294585c63a7b242f7dbb9",
            "suffix": "nii",
            "size": 6997764,
            "dir": false,
            "link": false,
            "url": "",
            "from": "http",
            "accountId": "",
            "canPreview": false,
            "canBot": false,
            "md5ToCompute": false,
            "mod": 667,
            "createTime": "2026-09-10T10:16:48+08:00",
            "modifyTime": "2026-09-10T10:16:48+08:00",
            "index": 0,
            "parentFileCount": 289
        },
        {
            "id": "b9bf10f8731704017fdd9edb78189a58",
            "datasetId": "de2bb704e6f047a38a5b84ac6614d592",
            "version": "V2",
            "fcstr": "31253.11.sciencedb.010wk.01CA2540",
            "fileName": "mwp129151.nii",
            "path": "/V2/VBMed_data/mwp129151.nii",
            "md5": "aebb26fa531ba2709f72fb93540486ad",
            "suffix": "nii",
            "size": 6997764,
            "dir": false,
            "link": false,
            "url": "",
            "from": "http",
            "accountId": "",
            "canPreview": false,
            "canBot": false,
            "md5ToCompute": false,
            "mod": 667,
            "createTime": "2026-09-10T10:16:51+08:00",
            "modifyTime": "2026-09-10T10:16:51+08:00",
            "index": 1,
            "parentFileCount": 289
        },
        {
        ...
        }
    ]
}
```

同理，"path": "/V2/VBMed_data/mwp129150.nii",说明这是一个文件，那么携带该id调用https://www.scidb.cn/api/gin-sdb-filetree/public/file/getBlobByFileId?fileId=13c7fdc27b68e9deb7f85c42b1d82e18
返回值为

```json
{
    "code": 20000,
    "message": "成功",
    "messageEn": "Success",
    "data": {
        "id": "c1e247a2044294585c63a7b242f7dbb9_6997764",
        "location": "/mnt/sciencedbNew/dataSet/c1e/247/a20/44294585c63a7b242f7dbb9/6997764.nii",
        "md5": "c1e247a2044294585c63a7b242f7dbb9",
        "size": 6997764
    }
}
```

其中"location": "/mnt/sciencedbNew/dataSet/c1e/247/a20/44294585c63a7b242f7dbb9/6997764.nii",为真实地址，需要保存下来。

注意文件夹可能有多层，也可能文件夹中包含文件夹与文件，

最终形成多个数据集路径json
其中一个示例为

```json
{
    "datasetId": "de2bb704e6f047a38a5b84ac6614d592",
    "V2": [
        {
            "VBMed_data": [
                {
                    "mwp129150.nii": "/mnt/sciencedbNew/dataSet/c1e/247/a20/44294585c63a7b242f7dbb9/6997764.nii"
                },
                {
                    "mwp129151.nii": "/mnt/sciencedbNew/dataSet/aeb/b26/fa5/31ba2709f72fb93540486ad/6997764.nii"
                },
                {
                    ...
                }
            ]
        },
        {
            "本研究使用的ABIDE受试者编号.docx": "/mnt/sciencedbNew/dataSet/da3/b5f/4aa/db9dcc008f7622fef49ab70/12020.docx"
        }
    ]
}
```

数据集表名称为scidb_dataseek_filePath，数据库为mongdb，请在E:\project\common\src\main\java\cn\tds\common\domain中新建实体类，并在TradingApplicationTests中编写方法