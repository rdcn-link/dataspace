# 海洋分析与联动可视化

沿用现有 `tools/*/manifest.json` 注册、沙箱运行器、NetCDF/xarray 数据处理和隔离 HTML 文件预览。没有新增服务、前端路由或部署端口。21 个工具在后端启动时自动发现；沙箱镜像安装本插件依赖。容器更新仍仅通过项目根目录的 `./run.sh`。

| 分析工具 | 数值结果 | 可视化 |
|---|---|---|
| `ocean_inspect` | 坐标、变量、单位、CF 质量标记元数据 | 探查报告 |
| `ocean_qc_mask` | 显式质量筛选后的 NetCDF、有效值计数 | PNG 预览 |
| `ocean_profile` | 指定时间、最近格点的垂直剖面 | 剖面曲线 |
| `ocean_depth_slice` | 指定时间、水层的二维 NetCDF | 水层分布图 |
| `ocean_time_depth` | 站点时间—垂直坐标矩阵 | 时间—深度图 |
| `ocean_region_timeseries` | 区域有效格点面积加权均值 | 曲线或时间—深度图 |
| `ocean_transect` | 距离、请求坐标、实际格点坐标和断面值 | 距离—深度断面 |
| `ocean_current_speed` | 流速、相对真北顺时针的去向角 | 流速切片预览；箭头见联动视图 |
| `ocean_temperature_salinity` | 有效温盐配对及相关系数 | 温盐散点图 |
| `ocean_thermodynamics` | TEOS-10 绝对盐度、保守温度、密度、sigma0 | 首个结果变量切片预览；其余字段可用联动视图打开 |
| `ocean_interactive_view` | 内嵌有界数据的离线 HTML；选择结果可导出 CSV | 地图、时间、深度、剖面、区域曲线、断面、温盐图、海流方向联动 |

## 新增诊断工具（1.1）

每个新增工具均输出 NetCDF 和主要物理量的 PNG；多变量诊断分别绘图，状态码及计数保留在数值文件中。

| 工具 | 分析结果与图件 |
|---|---|
| `ocean_mixed_layer_depth` | 温差/密度阈值混合层深度图、检出状态 |
| `ocean_thermocline` | 最大降温梯度层的中点深度图、梯度图 |
| `ocean_isotherm_depth` | 最浅等温面穿越深度图 |
| `ocean_buoyancy_frequency` | TEOS-10 N² 层结图、中点压力图 |
| `ocean_heat_content` | 指定上下界的单位面积相对热含量图 |
| `ocean_freshwater_content` | 指定参考盐度的等效淡水厚度图 |
| `ocean_vertical_interpolate` | 指定物理深度层的插值数据与预览 |
| `ocean_current_diagnostics` | 球面相对涡度、水平散度及各自分布图 |
| `ocean_eddy_kinetic_energy` | 逐时间 EKE、基准时段平均 EKE 及图件 |
| `ocean_temporal_anomaly` | 基准期异常、基准均值图和有效样本数 |

数值工具要求 `output_path` 为结果目录下的 `.nc`，默认伴随同名 `.png`；`visualize=false` 可关闭图片。多维 PNG 为明确标注所选索引的快速预览，完整数值保留在 NetCDF。浏览工具输出 `.html`，通过现有 HTML 预览打开。HTML 预览允许用户下载 CSV，仍不授予 iframe 同源权限。联动图无 CDN、在线底图或网络请求，地理坐标图直接显示原始经纬度网格。

## 联动浏览

```json
{
  "input_path": "/data/example/temperature.nc",
  "output_path": "/home/ubuntu/output/ocean.html",
  "variable": "temperature",
  "salinity_variable": "salinity",
  "eastward_variable": "u",
  "northward_variable": "v",
  "vertical_coordinate": "depth"
}
```

通过 `ocean_interactive_view` 调用以上参数。盐度、两个流速变量均可省略；两个流速分量必须同时提供。

- 地图点击：所有深度的最近格点剖面，明确显示实际选中位置。
- 时间滑块/播放/点击时间曲线：地图、剖面、断面、温盐图同步切换。
- 水层滑块/点击剖面：地图和区域均值曲线同步切换，剖面标记当前层。
- 框选：按当前水层计算各时间的区域均值；温盐图显示当前时间、区域全部深度的有效配对。
- 断面模式拖动：两个端点间 100 个采样位置；保留陆地/缺测间隙。
- 海流箭头：随时间、水层切换，等长箭头仅表示地理流向；速度大小可切换到预先计算的 speed 变量。
- 温盐选择器：在内嵌变量之间切换；不擅自识别水团或混用不同温盐定义。

`ocean_math.js` 将选点、区域时间序列、断面和配对计算与页面绘制分离，便于以后用于环境监测和水文站点视图。本次未扩展其他领域插件。

## 科学与数据边界

- 当前支持一维、单调、独立的经纬度及物理垂直坐标。联动浏览、余弦面积均值要求等间距经纬网；曲线网格、交错流速网格需先用已有重网格能力转换。
- 深度长度单位统一为米、向下为正；读取 `positive`，或明确的 `standard_name=depth`。海水压力必须声明 `standard_name=sea_water_pressure`，统一显示 dbar，不直接标为米。
- sigma、模型层、`formula_terms` 等参数化垂直坐标要求先进行物理坐标转换，本插件不将层索引当作深度。压力转深度也不采用“1 dbar = 1 m”的近似。
- TEOS-10 要求摄氏现场温度及实用盐度的明确 standard_name。用 GSW 的 `p_from_z`、`SA_from_SP`、`CT_from_t`、`rho`、`sigma0` 计算；不接受未声明的潜温或绝对盐度作为实用盐度。
- 质量变量必须与相应物理变量逐维匹配。`accepted_flags` 为精确值匹配；`reject_bits` 为“任一指定坏位出现即拒绝”，两种规则互斥。辅助变量可以分别指定 `salinity_qc_variable`、`eastward_qc_variable`、`northward_qc_variable`，共用当前筛选规则；规则不同的变量应分别先运行质量过滤。没有指定的变量不会自动应用标记。
- 区域均值按 `cos(latitude)` 加权，仅归一化有效格点权重；无有效值返回缺测，不返回 0。数值区域工具支持跨日期变更线 bbox；浏览时跨线区域建议先转换成连续经度并裁剪。
- 断面沿最短经度弧的经纬度线性路径采样；距离为球面累计距离（半径 6371.0088 km）。最近格点采样，不做跨陆地插值；超出源覆盖的数值请求被拒绝。
- 总数据上限 200 万数值；浏览上限包含全部内嵌变量，超限明确要求 `netcdf_subset`，不静默降采样。地图色标在全部时间与深度间固定，避免切换时视觉误判。
- 输入只读，结果仅写入 `AI_DATASEEK_OUTPUT_ROOT`（默认 `/home/ubuntu/output`）。HTML 不包含输入文件路径、任意全局属性、身份信息或存储状态；不会修改数据集挂载及 `DATASET_HOST_PATH_ALLOWLIST`。

科学依据：[CF 坐标与质量标记约定](https://cfconventions.org/cf-conventions/cf-conventions.html)、[TEOS-10 GSW 官方实现](https://github.com/TEOS-10/GSW-Python)。

## 验证

```bash
# 本地完整海洋依赖（镜像构建已经包含此步骤）
uv pip install --python sandbox/.venv/bin/python -r tools/ocean/requirements.txt
(cd sandbox && uv run pytest tests/test_ocean_plugin.py)
node --test tools/ocean/test_interaction.cjs
```

测试使用合成四维场，核对剖面、层切片、区域权重、断面端点、质量规则、速度方向、TEOS-10 表层一致性、倒序坐标与向上深度，以及浏览数据不包含源路径。

## 诊断定义与示例

以下参数与通用的 `input_path`、`output_path`（`.nc`）及 `variable` 一起传入对应工具。海洋诊断复用已有质量筛选、坐标检查、结果导出和绘图模块；没有新增运行依赖。

| 场景 | 工具参数示例 |
|---|---|
| 温差混合层 | `ocean_mixed_layer_depth`: `criterion="temperature", reference_depth=10, threshold=0.2` |
| 密度混合层 | `ocean_mixed_layer_depth`: `criterion="density", salinity_variable="salinity", threshold=0.03` |
| 上层温跃层 | `ocean_thermocline`: `min_depth=10, max_depth=200` |
| 20°C 等温面 | `ocean_isotherm_depth`: `temperature_value=20` |
| 静力稳定性 | `ocean_buoyancy_frequency`: `salinity_variable="salinity"` |
| 0–200m 热含量 | `ocean_heat_content`: `top_depth=0, bottom_depth=200, reference_temperature=0, density=1025, heat_capacity=3990` |
| 0–100m 淡水含量 | `ocean_freshwater_content`: `variable="salinity", top_depth=0, bottom_depth=100, reference_salinity=35` |
| 统一深度层 | `ocean_vertical_interpolate`: `depth_levels=[0,10,30,50,100]` |
| 流场旋转与辐合 | `ocean_current_diagnostics`: `variable="u", northward_variable="v"` |
| 流速变动能量 | `ocean_eddy_kinetic_energy`: `variable="u", northward_variable="v", baseline_start="2024-01-01", baseline_end="2024-12-31"` |
| 温度绝对异常 | `ocean_temporal_anomaly`: `baseline_start="2024-01-01", baseline_end="2024-12-31"` |

- 混合层参考深度默认 10m。温度判据取相对参考的绝对温差，密度判据取 TEOS-10 sigma0 的增加量。默认阈值分别为 0.2°C 和 0.03kg/m³；这是可配置阈值诊断，不替代针对具体区域的判据选择。首次越阈值时在相邻层间线性定位；`detection_status`: 0=检出、1=观测深度内未越阈值、2=缺测阻断、3=参考值无效。未检出不以最深层假充边界。参考：[de Boyer Montégut et al. (2004)](https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2004JC002378)。
- 温跃层只搜索范围内完整相邻有效层，取最负 `dT/dz`，深度为区间中点；均温或全为温度倒置时返回缺测。等温面只返回从最浅观测层起、未被缺测阻断的第一次穿越。两者不声称未观测深度内不存在其他界面。
- N² 使用 SA、CT、海水压力及纬度调用 [GSW Nsquared](https://www.teos-10.org/pubs/gsw/html/gsw_Nsquared.html)，输出位置在相邻层中间，单位 s⁻²，负值保持为静力不稳定，不开平方或截断为零。几何中点深度仅用于绘图，精确中点压力另行保留。GSW 的多项式近似在海洋学适用范围内最准确。
- 热含量为 `rho * cp * ∫(T - Tref) dz`，采用显式常密度、常比热近似，不等同完整 TEOS-10 焓积分；默认参考 0°C，单位 J/m²。淡水含量为 `∫(Sref-S)/Sref dz`，单位 m，高于参考盐度时允许负值。积分使用完整区间梯形法；上下界可在相邻有效层内插值，区间内任何缺测均导致该柱缺测。压力坐标不能充当几何厚度。
- 垂直插值只在相邻有效层内进行，不删除缺测层后跨越间隙，不外推；输出 `ocean_depth` 明确为米、向下为正。总输出也受 200 万数值上限约束。
- 流场诊断采用球面公式 `div=(∂u/∂λ+∂(v cosφ)/∂φ)/(R cosφ)`、`vorticity=(∂v/∂λ-∂(u cosφ)/∂φ)/(R cosφ)`。经纬度转弧度，速度转 m/s；至少 3×3 格点，绝对纬度须小于 89°。边界不外推，也不跨周期接缝求导。参考：[NCAR POP 球面方程](https://ncar.github.io/POP/doc/build/html/reference_manual/POPRefManual.html)。
- 时间异常使用显式基准期间的**等样本**均值，不是月气候态异常，时间间隔不等时也不自动转为时间加权。需要已解码、递增且唯一的 CF 时间；每个格点基准至少两个有效样本。季节气候态继续使用现有 NetCDF 气候态工具。
- EKE 为 `0.5*((u-mean_u)^2+(v-mean_v)^2)`，均值只使用基准期双分量均有效的样本；另外输出基准期平均 EKE。没有自动去趋势、去季节或滤波，因此不是涡旋识别结果。异常和 EKE 的基准期写入结果文件。

新增验证：`cd sandbox && uv run pytest tests/test_ocean_advanced.py`，覆盖解析剖面、完整区间积分、缺测阻断、GSW 对照、球面导数、双分量配对均值及图件生成。
