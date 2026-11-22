package cn.tds.trading.controller;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.tds.common.core.OrderRequest;
import cn.tds.common.domain.*;
import cn.tds.trading.repository.OrderDetailRepository;
import cn.tds.trading.service.TdsOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;

/**
 * TdsOrderController Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/10 17:05
 */
@RestController
@AllArgsConstructor
@Tag(name = "订单管理")
@RequestMapping("/order")

//@CrossOrigin
public class TdsOrderController {

    private final TdsOrderService tdsOrderService;

    private final OrderDetailRepository orderDetailRepository;


    @Operation(summary = "条件分页查询订单信息")
    @GetMapping("/order.page")
    public OdcResponse pageOrder(@RequestParam(name = "page", defaultValue = "1") int page,
                                 @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                 @RequestParam(name = "username", required = false) String username,
                                 @RequestParam(name = "userType", required = false) String userType,
                                 @RequestHeader(name = "X-TdsUid", required = false) String uid,
                                 @RequestParam(name = "businessType", required = false) String businessType,
                                 @RequestParam(name = "title", required = false) String title,
                                 @RequestParam(name = "status", defaultValue = "9") int status) {
        return tdsOrderService.pageOrder(page, pageSize, username, userType, uid, businessType, title, status);
    }

    @Operation(summary = "根据uid查询待审批订单")
    @GetMapping("/order.approval.page")
    public OdcResponse pageApprovalOrder(@RequestParam(name = "page", defaultValue = "1") int page,
                                         @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                         @RequestParam(name = "Uid", required = false) String Uid,
                                         @RequestParam(name = "userType", required = false) String userType,
                                         @RequestParam(name = "status", required = false) Integer status //0:待审批 1全部
    ) {
        return tdsOrderService.pageApprovalOrder(page, pageSize, Uid, userType, status);
    }

    @Operation(summary = "分页查询订单信息")
    @GetMapping("/order.pageall")
    public OdcResponse pageOrderAll(@RequestParam(name = "page", defaultValue = "1") int page,
                                    @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.pageOrderAll(page, pageSize);
    }

    @Operation(summary = "根据标题查询订单信息")
    @GetMapping("/order.search")
    public OdcResponse searchOrder(@RequestParam(name = "page", defaultValue = "1") int page,
                                   @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                   @RequestParam(name = "title", required = false) String title) {
        return tdsOrderService.searchOrder(page, pageSize, title);
    }

    @Operation(summary = "查询订单详情")
    @GetMapping("/order.detail/{oid}")
    public OdcResponse getOrderDetail(@PathVariable String oid) {
        return tdsOrderService.findByOid(oid);
    }

    @Operation(summary = "添加订单")
    @PostMapping("/order.save")
    public OdcResponse saveOrder(@RequestBody OrderRequest orderRequest) {
        return tdsOrderService.save(orderRequest);
    }

//    @Operation(summary = "数据中心同意申请")
//    @PostMapping("/order.center.agree.apply/{oid}")
//    public OdcResponse centerAgreeOrderApply(@PathVariable String oid,
//                                  @RequestParam(name = "status", defaultValue = "0") int Status,
//                                  @RequestParam(name = "uid", required = false) String uid,
//                                  @RequestParam(name = "reason", required = false) String reason) {
//        return tdsOrderService.centerAgreeOrderApply(oid, Status, uid, reason);
//    }

    @Operation(summary = "数据提供方同意申请")
    @PostMapping("/order.seller.agree.apply/{oid}")
    public OdcResponse sellerAgreeOrderApply(@PathVariable String oid,
                                             @RequestParam(name = "status", defaultValue = "0") int Status,
                                             @RequestParam(name = "uid", required = false) String uid,
                                             @RequestParam(name = "reason", required = false) String reason) {
        return tdsOrderService.sellerAgreeOrderApply(oid, Status, uid, reason);
    }

    @Operation(summary = "数据中心同意审批")
    @PostMapping("/order.center.agree.approval/{oid}")
    public OdcResponse centerAgreeOrderApproval(@PathVariable String oid,
                                                @RequestParam(name = "status", defaultValue = "0") int Status,
                                                @RequestParam(name = "uid", required = false) String uid,
                                                @RequestParam(name = "reason", required = false) String reason) {
        return tdsOrderService.centerAgreeOrderApproval(oid, Status, uid, reason);
    }


    @Operation(summary = "同意交易")
    @PostMapping("/order.agree/{oid}")
    public OdcResponse agreeOrder(@PathVariable String oid,
                                  @RequestParam(name = "status", defaultValue = "0") int Status,
                                  @RequestParam(name = "uid", required = false) String uid,
                                  @RequestParam(name = "reason", required = false) String reason) {
        return tdsOrderService.agreeOrder(oid, Status, uid, reason);
    }


    @Operation(summary = "合同协商")
    @PostMapping("/order.negotiate/{oid}")
    public OdcResponse negotiateOrder(@PathVariable String oid,
                                      @RequestParam(name = "file") MultipartFile file) {
        return tdsOrderService.negotiateOrder(oid, file);
    }

    @Operation(summary = "合同协商完成")
    @PostMapping("/order.contract/{oid}")
    public OdcResponse contractOrder(@PathVariable String oid,
                                     @RequestParam(name = "file") MultipartFile file) {
        return tdsOrderService.contractOrder(oid, file);
    }

    @Operation(summary = "卖家审核合同")
    @PostMapping("/contract.review/{oid}")
    public OdcResponse contractReview(@PathVariable String oid,
                                      @RequestParam(name = "status", defaultValue = "-1") int status,
                                      @RequestParam(name = "reason", required = false) String reason) {
        return tdsOrderService.contractReview(oid, status, reason);
    }

    @Operation(summary = "平台审核合同")
    @PostMapping("/platform.review/{oid}")
    public OdcResponse platformReview(@PathVariable String oid,
                                      @RequestParam(name = "status", defaultValue = "-1") int status,
                                      @RequestParam(name = "reason", required = false) String reason) {
        return tdsOrderService.platformReview(oid, status, reason);
    }

    @Operation(summary = "支付完成")
    @PostMapping("/order.pay/{oid}")
    public OdcResponse payOrder(@PathVariable String oid) {
        return tdsOrderService.payOrder(oid);
    }

    @Operation(summary = "合同模板下载")
    @GetMapping("/order.contract.template/{oid}")
    public ResponseEntity<Resource> contractTemplate(@PathVariable String oid) throws IOException {
        return tdsOrderService.contractTemplate(oid);
    }

    @Operation(summary = "合同下载")
    @GetMapping("/order.contract.download/{oid}")
    public ResponseEntity<Resource> contractDownload(@RequestHeader("X-TdsUser") String username,
                                                     @PathVariable String oid) throws IOException {//todo 根据请求头中的用户，判断该订单是否属于该用户
        return tdsOrderService.contractDownload(username, oid);
    }

    @Operation(summary = "更新数据下载链接")
    @PostMapping("/order.updateUrl/{oid}")
    public OdcResponse updateUrl(@PathVariable String oid,
                                 @RequestParam String url) {
        return tdsOrderService.updateUrl(oid, url);
    }


    @Operation(summary = "订单数据下载")
    @GetMapping("/order.data.download/{oid}")
    public ResponseEntity<Resource> updateDownload(@RequestHeader("X-TdsUser") String username,
                                                   @PathVariable String oid) throws IOException {//todo 根据请求头中的用户，判断该订单是否属于该用户
        return tdsOrderService.dataDownload(username, oid);
    }

    @Operation(summary = "评价")
    @PostMapping("/order.comment")
    public OdcResponse comment(@RequestBody TdsEvaluation tdsEvaluation) {
        return tdsOrderService.comment(tdsEvaluation);
    }

    @Operation(summary = "获取数据集评价")
    @GetMapping("/dataset.evaluation")
    public OdcResponse getComment(@RequestParam String cstr) {
        return tdsOrderService.getComment(cstr);
    }

    @Operation(summary = "申诉")
    @PostMapping("/order.complaint")
    public OdcResponse complaint(@RequestBody OrderComplaint orderComplaint) {
        return tdsOrderService.complaint(orderComplaint);
    }

    @Operation(summary = "数据统计")
    @GetMapping("/order.statistics")
    public OdcResponse statistics() {
        return tdsOrderService.statistics();
    }

    @Operation(summary = "首页数据统计")
    @GetMapping("/tds.statistics")
    public OdcResponse homePageStatistics() {
        return tdsOrderService.homePageStatistics();
    }

    @Operation(summary = "分页查询数据服务")
    @GetMapping("/dataService.page")
    public OdcResponse dataServicePage(@RequestParam(name = "page", defaultValue = "1") int page,
                                       @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                       @RequestParam(name = "name", required = false) String name,
                                       @RequestParam(name = "dataCenterName", required = false) String dataCenterName,
                                       @RequestParam(name = "type", required = false) String type) {
        return tdsOrderService.dataServicePage(page, pageSize, name, dataCenterName, type);
    }

    @Operation(summary = "分页查询数据集")
    @GetMapping("/dataset.page")
    public OdcResponse datasetPage(@RequestParam(name = "page", defaultValue = "1") int page,
                                   @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                   @RequestParam(name = "titleZh", required = false) String titleZh,
                                   @RequestParam(name = "dataCenterName", required = false) String dataCenterName,
                                   @RequestParam(name = "subject", required = false) String subject,
                                   @RequestParam(name = "source", required = false) String source,
                                   @RequestParam(name = "shareMode", required = false) String shareMode,
                                   @RequestParam(name = "sort", defaultValue = "createAt") String sort) {
        return tdsOrderService.datasetPage(page, pageSize, titleZh, dataCenterName, subject, source, shareMode, sort);
    }

    @Operation(summary = "根据cstr查询下载链接")
    @GetMapping("/dataset.getDownloadUrl")
    public OdcResponse getDownloadUrl(@RequestParam String cstr) {
        return tdsOrderService.getDownloadUrl(cstr);
    }

    @Operation(summary = "增加下载量")
    @GetMapping("/dataset.addDownloadCount")
    public OdcResponse addDownloadCount(@RequestParam String cstr) {
        return tdsOrderService.addDownloadCount(cstr);
    }


    @Operation(summary = "查询数据集详情")
    @GetMapping("/dataset/")
    public OdcResponse datasetDetail(@RequestParam String cstr) {
        return tdsOrderService.datasetDetail(cstr);
    }

    @Operation(summary = "获取数据服务详情")
    @GetMapping("/dataService/{sid}")
    public OdcResponse dataServiceDetail(@PathVariable String sid) {
        return tdsOrderService.dataServiceDetail(sid);
    }

    @Operation(summary = "接口清单")
    @GetMapping("/dataService.apiList")
    public OdcResponse apiList(@RequestParam String sid) {
        return tdsOrderService.apiList(sid);
    }

    @Operation(summary = "根据数据中心统计数据集信息")
    @GetMapping("/datacenter.datasetStatistics")
    public OdcResponse datacenterDatasetStatistics() {
        return tdsOrderService.datacenterDatasetStatistics();
    }

    @Operation(summary = "根据数据中心查询统计数据集信息")
    @GetMapping("/datacenter.datasetStatistics/{dataCenterName}")
    public OdcResponse datacenterDatasetStatistics(@PathVariable String dataCenterName) {
        return tdsOrderService.datacenterDatasetStatistics(dataCenterName);
    }

    @Operation(summary = "根据学科分类统计数据集信息")
    @GetMapping("/subject.datasetStatistics")
    public OdcResponse subjectDatasetStatistics() {
        return tdsOrderService.subjectDatasetStatistics();
    }

    @Operation(summary = "根据专题统计数据集信息")
    @GetMapping("/topic.datasetStatistics")
    public OdcResponse topicDatasetStatistics() {
        return tdsOrderService.topicDatasetStatistics();
    }

    @Operation(summary = "根据数据中心统计数据服务信息")
    @GetMapping("/datacenter.dataServiceStatistics")
    public OdcResponse datacenterDataServiceStatistics() {
        return tdsOrderService.datacenterDataServiceStatistics();
    }

    @Operation(summary = "根据服务类型统计数据服务信息")
    @GetMapping("/type.dataServiceStatistics")
    public OdcResponse typeDataServiceStatistics() {
        return tdsOrderService.typeDataServiceStatistics();
    }

    @Operation(summary = "根据共享方式统计数据集信息")
    @GetMapping("/shareMode.datasetStatistics")
    public OdcResponse shareModeDatasetStatistics() {
        return tdsOrderService.shareModeDatasetStatistics();
    }

    @Operation(summary = "根据开放域统计数据集信息")
    @GetMapping("/openDomain.datasetStatistics")
    public OdcResponse openDomainDatasetStatistics() {
        return tdsOrderService.openDomainDatasetStatistics();
    }

    @Operation(summary = "获取top数据集")
    @GetMapping("/dataset.top")
    public OdcResponse datasetTop() {
        return tdsOrderService.datasetTop();
    }

    @Operation(summary = "分页获取连接器")
    @GetMapping("/connector.page")
    public OdcResponse connectorPage(@RequestParam(name = "page", defaultValue = "1") int page,
                                     @RequestParam(name = "pageSize", defaultValue = "3") int pageSize) {
        return tdsOrderService.connectorPage(page, pageSize);
    }


    @GetMapping("/select.init/{code}")
    public OdcResponse select(@PathVariable String code) {
        return tdsOrderService.getSelect(code);
    }


    @Operation(summary = "获取连接器实时信息")
    @GetMapping("/dynamic.get")
    public OdcResponse getDynamic() {
        return tdsOrderService.dynamicGet();
    }

    @Operation(summary = "获取交易实时信息")
    @GetMapping("/dynamic.transaction.get")
    public OdcResponse getDynamicTransaction(@RequestParam(name = "page", defaultValue = "1") int page,
                                             @RequestParam(name = "pageSize", defaultValue = "3") int pageSize) {
        return tdsOrderService.getDynamicTransaction(page, pageSize);
    }

    @Operation(summary = "获取数据实时信息")
    @GetMapping("/dynamic.dataset.get")
    public OdcResponse getDynamicDataset(@RequestParam(name = "page", defaultValue = "1") int page,
                                         @RequestParam(name = "pageSize", defaultValue = "3") int pageSize) {
        return tdsOrderService.getDynamicDataset(page, pageSize);
    }

    @Operation(summary = "文件下载")
    @GetMapping("/order.file.download/{cstr}")
    public ResponseEntity<Resource> fileDownload(
            @PathVariable String cstr,
            @RequestParam String code,
            @RequestParam String uid) throws IOException {
        return tdsOrderService.fileDownload(cstr, code, uid);
    }

    @Operation(summary = "上传申请表")
    @PostMapping("/order.applicationFile/{uid}")
    public OdcResponse applicationFile(@PathVariable String uid,
                                       @RequestParam(name = "type") Integer type,
                                       @RequestParam(name = "file") MultipartFile file) {
        return tdsOrderService.applicationFile(uid, type, file);
    }

    @Operation(summary = "申请表下载")
    @GetMapping("/order.application.download/{oid}")
    public ResponseEntity<Resource> applicationDownload(@PathVariable String oid,
                                                        @RequestParam String uid) throws IOException {
        return tdsOrderService.applicationDownload(uid, oid);
    }


    @Operation(summary = "根据uid查询所有数据集")
    @GetMapping("/dataset.byUid")
    public OdcResponse getDataSetByUid(@RequestParam String uid,
                                       @RequestParam(name = "page", defaultValue = "1") int page,
                                       @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                       @RequestParam(name = "status", required = false) Integer status) {
        return tdsOrderService.getDataSetByUid(uid, page, pageSize, status);
    }

    @Operation(summary = "持续沟通交易")
    @PostMapping("/order.continue")
    public OdcResponse continueOrder(@RequestParam String oid,
                                     @RequestParam String reason) {
        return tdsOrderService.continueOrder(oid, reason);
    }

    @Operation(summary = "根据uid查询通知消息")
    @GetMapping("/order.noticeByUid")
    public OdcResponse noticeByUid(@RequestParam String uid,
                                   @RequestParam(name = "page", defaultValue = "1") int page,
                                   @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.noticeByUid(uid, page, pageSize);
    }

    @Operation(summary = "收藏数据集")
    @PostMapping("/favorite.save")
    public OdcResponse addFavorite(@RequestParam String uid,
                                   @RequestParam String cstr) {
        return tdsOrderService.addFavorite(uid, cstr);
    }

    @Operation(summary = "取消收藏")
    @DeleteMapping("/favorite.remove")
    public OdcResponse removeFavorite(@RequestParam String uid,
                                      @RequestParam String cstr) {
        return tdsOrderService.removeFavorite(uid, cstr);
    }

    @Operation(summary = "分页查看收藏的数据集")
    @GetMapping("/favorite.page")
    public OdcResponse pageFavorites(@RequestParam String uid,
                                     @RequestParam(name = "page", defaultValue = "1") int page,
                                     @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.pageFavorites(uid, page, pageSize);
    }

    @Operation(summary = "统计收藏量")
    @GetMapping("/favorite.statistics")
    public OdcResponse favoriteStatistics(@RequestParam String cstr) {
        return tdsOrderService.favoriteStatistics(cstr);
    }

    @Operation(summary = "检查是否已收藏")
    @GetMapping("/favorite.check")
    public OdcResponse checkFavorited(@RequestParam String uid,
                                      @RequestParam String cstr) {
        return tdsOrderService.checkFavorited(uid, cstr);
    }

    @Operation(summary = "评价数据集")
    @PostMapping("/evaluation.save")
    public OdcResponse saveEvaluation(@RequestParam String uid,
                                      @RequestParam String cstr,
                                      @RequestParam String description,
                                      @RequestParam(defaultValue = "0") double score) {
        return tdsOrderService.saveEvaluation(uid, cstr, description, score);
    }

    @Operation(summary = "获取数据集的评价")
    @GetMapping("/evaluation.dataset/{cstr}")
    public OdcResponse getDatasetEvaluations(@PathVariable String cstr) {
        return tdsOrderService.getDatasetEvaluations(cstr);
    }

    @Operation(summary = "批量审核通过数据集")
    @PostMapping("/dataset.batchApprove")
    public OdcResponse batchApproveDataSet(@RequestBody List<String> cstrList) {
        return tdsOrderService.batchApproveDataSet(cstrList);
    }

    @Operation(summary = "分页查看用户的评价")
    @GetMapping("/evaluation.user.page")
    public OdcResponse getUserEvaluations(@RequestParam String uid,
                                          @RequestParam(name = "page", defaultValue = "1") int page,
                                          @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.getUserEvaluations(uid, page, pageSize);
    }

    @Operation(summary = "是否有未发布数据集")
    @GetMapping("/dataset.hasUnpublished")
    public OdcResponse hasUnpublished(@RequestParam String uid) {
        return tdsOrderService.hasUnpublished(uid);
    }

    @Operation(summary = "是否有未读消息")
    @GetMapping("/notice.hasUnread")
    public OdcResponse hasUnreadNotice(@RequestParam String uid) {
        return tdsOrderService.hasUnreadNotice(uid);
    }

    @Operation(summary = "单点读取消息")
    @GetMapping("/notice.singlerRead")
    public OdcResponse singlerRead(@RequestParam String uid,
                                   @RequestParam String noticeId) {
        return tdsOrderService.singlerRead(uid, noticeId);
    }

    @Operation(summary = "全局读取消息")
    @GetMapping("/notice.globalRead")
    public OdcResponse globalRead(@RequestParam String uid) {
        return tdsOrderService.globalRead(uid);
    }

    @Operation(summary = "查询该用户是否有快数通")
    @GetMapping("/order.hasKst")
    public OdcResponse hasKst(@RequestParam String uid) {
        return tdsOrderService.hasKst(uid);
    }

    @Operation(summary = "用户点击申请")
    @PostMapping("/order.apply.click")
    public OdcResponse applyClick(@RequestParam String uid,
                                  @RequestParam String cstr,
                                  @RequestParam String url) {
        return tdsOrderService.applyClick(uid, cstr, url);
    }

    @Operation(summary = "根据机构获取下载点赞浏览收藏总量")
    @GetMapping("/institution.countStatistics")
    public OdcResponse institutionCountStatistics(@RequestParam String institution) {
        return tdsOrderService.institutionCountStatistics(institution);
    }

    @Operation(summary = "根据机构获取评论")
    @GetMapping("/institution.comment")
    public OdcResponse institutionComment(@RequestParam String institution,
                                          @RequestParam(name = "page", defaultValue = "1") int page,
                                          @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.institutionComment(institution, page, pageSize);
    }


    @Operation(summary = "分页查看资讯")
    @GetMapping("/information.page")
    public OdcResponse getInformationPage(@RequestParam(name = "source", required = false) String source,
                                          @RequestParam(name = "page", defaultValue = "1") int page,
                                          @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.getInformationPage(source, page, pageSize);
    }

    @Operation(summary = "根据sctr集合查询数据集")
    @GetMapping("/dataset.getByCstrList")
    public OdcResponse getDatasetByCstrList(@RequestParam List<String> cstrList) {
        return tdsOrderService.getDatasetByCstrList(cstrList);
    }

    @Operation(summary = "根据cstr查询资讯")
    @GetMapping("/information.getByCstr")
    public OdcResponse getInformationByCstr(@RequestParam String cstr) {
        return tdsOrderService.getInformationByCstr(cstr);
    }

    @Operation(summary = "记录分析工具使用")
    @PostMapping("/order.addAnalysisToolCount")
    public OdcResponse addAnalysisToolCount(@RequestParam String uid,
                                            @RequestParam String title,
                                            @RequestParam String toolId,
                                            @RequestParam String source) {
        return tdsOrderService.addAnalysisToolCount(uid, title, toolId, source);
    }

    @Operation(summary = "分页查询分析工具使用记录")
    @GetMapping("/order.analysisTool.record")
    public OdcResponse listAnalysisToolRecord(@RequestParam String source,
                                              @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
                                              @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
                                              @RequestParam(name = "page", defaultValue = "1") int page,
                                              @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.listAnalysisToolRecord(source, startTime, endTime, page, pageSize);
    }

    @Operation(summary = "是否使用分析工具")
    @GetMapping("/order.hasAnalysisToolRecord")
    public OdcResponse hasAnalysisToolRecord(@RequestParam String uid,
                                             @RequestParam String toolId,
                                             @RequestParam String source) {
        return tdsOrderService.hasAnalysisToolRecord(uid, toolId,source);
    }

    @Operation(summary = "查询分析工具列表")
    @GetMapping("/order.analysisTool.list")
    public OdcResponse listAnalysisTool() {
        return tdsOrderService.listAnalysisTool();
    }

    @Operation(summary = "新增分析工具")
    @PostMapping("/order.analysisTool.add")
    public OdcResponse addAnalysisTool(@RequestBody TdsAnalysisTool tdsAnalysisTool) {
        return tdsOrderService.addAnalysisTool(tdsAnalysisTool);
    }

    @Operation(summary = "新增分析工具评价")
    @PostMapping("/order.analysisTool.evaluation.add")
    public OdcResponse addAnalysisToolEvaluation(@RequestBody TdsAnalysisToolEvaluation tdsAnalysisToolEvaluation) {
        return tdsOrderService.addAnalysisToolEvaluation(tdsAnalysisToolEvaluation);
    }

    @Operation(summary = "根据toolId查看分析工具评价列表")
    @GetMapping("/order.analysisTool.evaluation.list")
    public OdcResponse listAnalysisToolEvaluation(@RequestParam String toolId) {
        return tdsOrderService.listAnalysisToolEvaluation(toolId);
    }

    @Operation(summary = "统计空间枢纽相关数据")
    @GetMapping("/spaceHub.statistics")
    public OdcResponse spaceHubStatistics(@RequestParam String source) {
        return tdsOrderService.spaceHubStatistics(source);
    }

    @Operation(summary = "根据时间统计空间枢纽相关数据")
    @GetMapping("/spaceHub.statisticsByDate")
    public OdcResponse spaceHubStatisticsByDate(@RequestParam String source,
                                                @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
                                                @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime) {
        return tdsOrderService.spaceHubStatisticsByDate(source, startTime, endTime);
    }



    @Operation(summary = "查询全部数据中心")
    @GetMapping("/dataCenter.all")
    public OdcResponse getAllDataCenter() {
        return tdsOrderService.getAllDataCenter();
    }

    @Operation(summary = "新增数据中心")
    @PostMapping("/dataCenter.add")
    public OdcResponse addDataCenter(@RequestBody DataCenter dataCenter) {
        return tdsOrderService.addDataCenter(dataCenter);
    }

    @Operation(summary = "根据数据中心查询json")
    @GetMapping("/dataCenter.json")
    public OdcResponse getDataCenterJson(@RequestParam String dataCenterName) {
        return tdsOrderService.getDataCenterJson(dataCenterName);
    }

    @Operation(summary = "申请数据集")
    @PostMapping("/dataset.apply")
    public OdcResponse applyDataset(@RequestBody DataSetApply dataSetApply) {
        return tdsOrderService.applyDataSet(dataSetApply);
    }

    @Operation(summary = "数据集申请审核")
    @PostMapping("/dataset.apply.Approval")
    public OdcResponse passDatasetApply(@RequestParam String applyId,
                                        @RequestParam String uid,
                                        @RequestParam(required = false) String reason,
                                        @RequestParam String status) {
        return tdsOrderService.DatasetApplyApproval(applyId, uid,reason,status);
    }

    @Operation(summary = "发送消息")
    @PostMapping("/dataset.sendMessage")
    public OdcResponse sendMessage(@RequestParam String name,
                                   @RequestParam String title,
                                   @RequestParam String openId,
                                   @RequestParam String url) {
        tdsOrderService.sendDatasetApplyMsg(name, title, openId, url);
        return OdcResponseBuilder.buildSuccess("消息发送成功");
    }

    @Operation(summary = "发送资讯消息")
    @PostMapping("/information.sendMessage")
    public OdcResponse sendInformationMessage(@RequestParam String title,
                                              @RequestParam String openId,
                                              @RequestParam String url) {
        tdsOrderService.sendInformationMsg(title, openId, url);
        return OdcResponseBuilder.buildSuccess("消息发送成功");
    }

    @Operation(summary = "根据用户查询数据集申请列表")
    @GetMapping("/dataset.apply.listByUser")
    public OdcResponse listDatasetApplyByUser(@RequestParam String uid,
                                              @RequestParam(name = "page", defaultValue = "1") int page,
                                              @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.listDatasetApplyByUser(uid, page, pageSize);
    }

    @Operation(summary = "根据用户查询数据集审批列表")
    @GetMapping("/dataset.approval.listByUser")
    public OdcResponse listDatasetApprovalByUser(@RequestParam String uid,
                                                  @RequestParam(name = "page", defaultValue = "1") int page,
                                                  @RequestParam(name = "pageSize", defaultValue = "10") int pageSize) {
        return tdsOrderService.listDatasetApprovalByUser(uid, page, pageSize);
    }

    @Operation(summary = "该用户是否可以下载该数据集")
    @GetMapping("/dataset.canDownload")
    public OdcResponse canDownloadDataset(@RequestParam String uid,
                                          @RequestParam String datasetId) {
        return tdsOrderService.canDownloadDataset(uid, datasetId);
    }

    @Operation(summary = "根据 token 下载数据集文件（流式传输）")
    @GetMapping("/dataset.downloadByToken")
    public ResponseEntity<Resource> downloadByToken(@RequestParam String token) throws IOException {
        return tdsOrderService.downloadByToken(token);
    }

    @Operation(summary = "生成数据集下载 token")
    @PostMapping("/dataset.generateDownloadToken")
    public OdcResponse generateDownloadToken(@RequestParam String uid,
                                             @RequestParam String datasetOid) {
        String token = tdsOrderService.generateDownloadToken(uid, datasetOid);
        return OdcResponseBuilder.buildSuccess(token);
    }



}






