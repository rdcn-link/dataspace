# 材料学分析组件

本插件提供 **25 个真实计算工具**，沿用现有 manifest 注册、沙箱命令、附件传递和文件预览。已有 CIF 解析、空间群、粉末衍射模拟、晶体预览及 XRDML 导入继续由 `chemistry` / `xrd` 提供；本插件补充材料实验与表征数据的参数计算，没有新增服务或前端入口。

## 输入与结果

- 实验数据使用 CSV/TSV；表头直接标明物理单位。`columns` 可映射实际表头，但不隐式换算单位。应变使用无量纲小数，温度使用 K，时间使用 s。
- 刚度和晶胞工具使用 JSON；显微工具使用单帧 8 位图像。
- `output_path` 是结果目录内的 `.json` 路径，默认根目录 `/home/ubuntu/output`。同时输出同名 `.csv` 数值表和 `.png` 图件；JSON 保存计算参数、拟合质量、结果单位和模型限制，不保存输入路径。
- 文件最多20MB，表格最多100000行，图像最多400万像素。输入只读；输出及派生CSV/PNG链接均检查结果目录边界。缺测和非有限数据报错，不自动删行跨越积分间隙。
- 所有组件为数据分析，不执行第一性原理模拟、不自动检索材料数据库，也不声称完成标准认证测试。

## 工具清单

| 类别 | 工具 | 结果与图件 |
|---|---|---|
| 力学 | `materials_elastic_modulus` | 杨氏模量、线性拟合质量；弹性拟合图 |
| 力学 | `materials_offset_yield` | 可配置偏移应变证明强度；应力曲线与偏移线 |
| 力学 | `materials_true_stress_strain` | 均匀变形段真实应力应变；真实曲线 |
| 力学 | `materials_strain_energy` | 实测加载功密度、实测最大应力；累积功曲线 |
| 力学 | `materials_creep_rate` | 指定稳态阶段蠕变速率；应变时间拟合 |
| 力学 | `materials_fatigue_basquin` | A、b及拟合质量；S-N双对数拟合图 |
| 力学 | `materials_vickers_hardness` | 逐压痕HV、平均值与离散性；硬度图 |
| 弹性张量 | `materials_elastic_tensor_vrh` | Voigt/Reuss/Hill模量、泊松比、各向异性；刚度热图 |
| 热学 | `materials_thermal_expansion` | 指定温区平均线膨胀系数；长度温度拟合 |
| 热学 | `materials_flash_diffusivity` | Parker半升温时间与热扩散率；归一化温升图 |
| 热分析 | `materials_dsc_enthalpy` | 带符号的单位质量焓变；基线校正热流图 |
| 热分析 | `materials_tga_analysis` | 失重、DTG峰候选及阈值温度；剩余质量曲线 |
| 动力学 | `materials_arrhenius_fit` | 表观活化能与前因子；Arrhenius图 |
| 动力学 | `materials_kissinger_fit` | 同一转变峰的表观活化能；Kissinger图 |
| 电子结构 | `materials_band_edges` | 给定k点上的带边、带隙和部分占据；能级散点图 |
| 电子结构 | `materials_dos_integral` | 给定能区每晶胞态数；DOS曲线 |
| 光学 | `materials_tauc_gap` | 指定跃迁幂次与拟合区间的Tauc带隙；变换与拟合图 |
| 电输运 | `materials_four_probe_resistivity` | 薄片四探针方阻、电阻率与偏移；I-V拟合图 |
| 电化学 | `materials_specific_capacity` | 单次充/放电段容量和质量比容量；累积容量曲线 |
| 电化学 | `materials_impedance_rc_fit` | Rs、Rct、C、时间常数和残差；Nyquist实测/拟合图 |
| 衍射定量 | `materials_williamson_hall` | 仪器展宽校正后的相干域尺寸、微应变；W-H拟合图 |
| 衍射定量 | `materials_cubic_lattice_fit` | 已索引立方相晶格常数、逐峰值与残差；Bragg拟合图 |
| 晶体应变 | `materials_lattice_strain` | 有限应变张量、主应变及体积变化；应变热图 |
| 显微组织 | `materials_micrograph_particles` | 保留对象面积、等效直径、质心；分割轮廓与粒径分布 |
| 表面表征 | `materials_bet_surface_area` | BET面积、单层容量、C及基本一致性检查；BET拟合图 |

## 调用示例

弹性模量：输入文件列为 `strain,stress_MPa`。

```json
{
  "input_path": "/data/example/tensile.csv",
  "output_path": "/home/ubuntu/output/young_modulus.json",
  "fit_min": 0.0002,
  "fit_max": 0.001
}
```

实际表头可显式映射：`"columns": {"strain": "engineering_strain", "stress_MPa": "stress"}`。若实际应力为Pa或应变为百分数，先用已有表格工具换算，不能只改表头。

弹性张量输入：

```json
{"stiffness_GPa": [[200,100,100,0,0,0],[100,200,100,0,0,0],[100,100,200,0,0,0],[0,0,0,50,0,0],[0,0,0,0,50,0],[0,0,0,0,0,50]]}
```

晶胞应变输入：

```json
{"reference_cell_angstrom": [[4,0,0],[0,4,0],[0,0,4]], "current_cell_angstrom": [[4.04,0,0],[0,4.04,0],[0,0,4.04]]}
```

显微组织分析：

```json
{
  "input_path": "/data/example/cropped_micrograph.png",
  "output_path": "/home/ubuntu/output/particles.json",
  "threshold_8bit": 100,
  "pixel_size_um": 0.2,
  "foreground": "dark",
  "min_area_pixels": 5,
  "exclude_boundary": true
}
```

## 各工具输入契约

### `materials_elastic_modulus`

在显式弹性区间拟合工程应力应变，计算杨氏模量及残差。 CSV/TSV必需列（名称表示单位）：strain,stress_MPa。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`。

### `materials_offset_yield`

用显式弹性区间与可配置偏移应变求实测曲线的证明强度，不外推交点。 CSV/TSV必需列（名称表示单位）：strain,stress_MPa。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`。

### `materials_true_stress_strain`

在用户声明的均匀拉伸范围转换真实应力应变；不用于颈缩后。 CSV/TSV必需列（名称表示单位）：strain,stress_MPa。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`uniform_strain_max`。

### `materials_strain_energy`

积分单调拉伸实测区间，计算累积加载功密度和实测最大应力，不将其误称断裂韧性。 CSV/TSV必需列（名称表示单位）：strain,stress_MPa。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_creep_rate`

对用户指定稳态阶段拟合应变时间曲线，返回蠕变速率。 CSV/TSV必需列（名称表示单位）：time_s,strain。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`。

### `materials_fatigue_basquin`

拟合失败试样的sigma_a=A*N^b疲劳关系；拒绝包含runout删失记录的数据。 CSV/TSV必需列（名称表示单位）：cycles_to_failure,stress_amplitude_MPa,failed。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_vickers_hardness`

根据载荷及两条压痕对角线计算Vickers硬度HV和压痕压力MPa。 CSV/TSV必需列（名称表示单位）：force_N,diagonal1_mm,diagonal2_mm。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_elastic_tensor_vrh`

由对称正定6×6刚度张量计算Voigt/Reuss/Hill体积、剪切、杨氏模量和各向异性。JSON字段stiffness_GPa，Voigt次序xx,yy,zz,yz,xz,xy，工程剪切应变约定。 输入JSON。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_thermal_expansion`

按指定温区和参考长度拟合区间平均线膨胀系数。 CSV/TSV必需列（名称表示单位）：temperature_K,length_m。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`, `reference_length_m`。

### `materials_flash_diffusivity`

按Parker绝热薄片模型从半升温时间计算热扩散率，要求显式脉冲、基线、平台和厚度。 CSV/TSV必需列（名称表示单位）：time_s,temperature_K。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`pulse_time_s`, `baseline_temperature_K`, `plateau_temperature_K`, `thickness_m`。

### `materials_dsc_enthalpy`

在指定时间范围对固定基线校正热流积分，返回沿用输入符号的比焓。 CSV/TSV必需列（名称表示单位）：time_s,heat_flow_W。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`start_time_s`, `end_time_s`, `baseline_W`, `mass_g`。

### `materials_tga_analysis`

计算热重质量损失、导数峰候选及指定失重阈值温度，不自动推断分解机制。 CSV/TSV必需列（名称表示单位）：temperature_K,mass_mg。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_arrhenius_fit`

按ln(rate)对1/T拟合表观活化能和前因子，同一单位与反应区间由用户保证。 CSV/TSV必需列（名称表示单位）：temperature_K,rate。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_kissinger_fit`

拟合ln(beta/Tp²)对1/Tp，计算同一转变峰的表观活化能。 CSV/TSV必需列（名称表示单位）：heating_rate_K_s,peak_temperature_K。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_band_edges`

按显式满占据数识别给定k点上的价带顶、导带底、采样直接/间接带隙及部分占据，不执行DFT。 CSV/TSV必需列（名称表示单位）：k_index,band_index,energy_eV,occupation。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`full_occupation`。

### `materials_dos_integral`

积分明确能量范围的态密度，输出每晶胞态数，不自动添加自旋倍数或费米权重。 CSV/TSV必需列（名称表示单位）：energy_eV,dos_states_eV_cell。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`energy_min_eV`, `energy_max_eV`。

### `materials_tauc_gap`

在用户指定线性区和跃迁幂次下计算Tauc带隙；输入必须是吸收系数而非吸光度。 CSV/TSV必需列（名称表示单位）：photon_energy_eV,absorption_cm_1。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`, `tauc_power`。

### `materials_four_probe_resistivity`

从I-V线性拟合计算共线等间距薄片四探针方阻和电阻率，保留电压偏移。 CSV/TSV必需列（名称表示单位）：current_A,voltage_V。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`thickness_m`。

### `materials_specific_capacity`

对单个充电或放电段积分容量和质量比容量，拒绝跨电流极性积分。 CSV/TSV必需列（名称表示单位）：time_s,current_A。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`active_mass_g`。

### `materials_impedance_rc_fit`

拟合固定电路Rs+(Rct||C)的复阻抗，返回电阻、电容、时间常数和Nyquist图；imag_ohm为带符号Im(Z)。 CSV/TSV必需列（名称表示单位）：frequency_Hz,real_ohm,imag_ohm。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_williamson_hall`

对已拟合同相衍射峰做高斯仪器展宽校正和真实W-H线性拟合，分离相干域尺寸与微应变。 CSV/TSV必需列（名称表示单位）：two_theta_deg,fwhm_deg,instrument_fwhm_deg。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`wavelength_angstrom`。

### `materials_cubic_lattice_fit`

由已索引立方单相峰的sin²(theta)对h²+k²+l²过原点拟合晶格常数；不自动检索物相。 CSV/TSV必需列（名称表示单位）：two_theta_deg,h,k,l。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`wavelength_angstrom`。

### `materials_lattice_strain`

计算对应晶胞基矢的Green-Lagrange有限应变、主应变与体积变化。JSON字段reference_cell_angstrom和current_cell_angstrom，均为行基矢3×3右手矩阵。 输入JSON。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：无。

### `materials_micrograph_particles`

按显式8位灰度阈值分割标定显微图，统计连通域面积与等效直径，输出轮廓和粒径分布；不自动分离接触颗粒。 输入单个8位图像。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`threshold_8bit`, `pixel_size_um`。

### `materials_bet_surface_area`

对显式吸附支路压力区间做BET拟合，以分子截面积计算比表面积并报告基本一致性检查。吸附量单位mol/kg。 CSV/TSV必需列（名称表示单位）：relative_pressure,adsorbed_mol_kg。 输出JSON计算依据、CSV数值和PNG图件。

额外必填参数：`fit_min`, `fit_max`, `molecular_cross_section_nm2`。

## 模型与适用边界

- 力学曲线要求单调加载段，比例应变为无量纲小数。证明强度只找实测交点；真实应力换算只接受用户声明的均匀拉伸范围；实测加载功不是裂纹扩展断裂韧性。疲劳不将runout试样当作失效点。
- VRH输入是GPa刚度矩阵，Voigt次序xx,yy,zz,yz,xz,xy，剪切采用工程应变。拒绝非对称/非正定矩阵。有限应变采用F=current.T @ inverse(reference.T)，E=(F.T F-I)/2，要求对应基矢而不是任意两套等价晶胞。
- 激光闪射是0.1388 L²/t_half的Parker瞬时脉冲、绝热、一维近似。平台温度、脉冲时间、厚度均显式指定，不自动做热损失修正。DSC仅固定基线积分；TGA仅统计和峰候选。
- Arrhenius/Kissinger报告表观参数，不证明反应机制；rate必须同单位。Tauc需要真实吸收系数、显式选择的线性区和幂次（直接允许2、间接允许0.5），不会自行判断跃迁类型。
- 能带工具分析已计算能量和占据数，不运行DFT，不将部分占据唯一解释为金属，k索引不是几何路径距离。DOS单位为states/eV/cell，不隐含补乘自旋简并。
- 四探针使用等间距共线薄片模型，几何修正由用户输入。容量仅积分单个不跨电流极性的片段；RC阻抗只拟合Rs+(Rct||C)，Im(Z)必须带原始符号，拒绝不可辨识结果。
- W-H基于孤立同相峰，高斯仪器宽度按平方差扣除，输出相干衍射域尺寸而非显微晶粒大小。立方晶格拟合要求用户正确给出hkl，不执行物相检索或Rietveld精修。
- 显微工具使用8邻域阈值连通域，默认剔除触边对象，不分离接触颗粒，不能用二维面积分数直接替代三维孔隙率。应先去除标尺、文字和非样品背景。
- BET输入吸附量mol/kg、分子截面积nm²；压力区间由用户选择，不默认氮气截面积。报告C、单层容量及两个基本一致性检查（n(1-p)递增、单层压力在拟合区间内），不声称通过完整Rouquerol准则或适用于所有微孔材料。

## 验证与集成

```bash
cd sandbox && uv run pytest tests/test_materials_plugin.py
```

每个工具都有解析数据的数值断言，并检查JSON/CSV/PNG实际生成；额外覆盖缺测、runout、负刚度、超范围积分、重复时间、仪器峰宽、双极性电流及输出符号链接边界。插件依赖由现有沙箱镜像安装，容器更新只使用根目录 `./run.sh`。

方法参考：[NIST Vickers定义](https://tsapps.nist.gov/srmext/certificates/archives/1896a.pdf)、[Pymatgen弹性张量文档](https://pymatgen.org/pymatgen.core.elasticity.html)、[NIST闪射热扩散方法](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=924024)、[Gamry等效阻抗电路](https://help.gamry.com/Framework/experiments_g_main_eis-theory_equivcircuit_models.html)、[IUPAC吸附表征建议](https://publications.iupac.org/pac/57/4/0603/index.html)。
