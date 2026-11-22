package cn.tds.trading.service;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.opendatachain.common.exception.OdcException;
import cn.opendatachain.common.util.DateUtils;
import cn.opendatachain.common.util.OdcUtils;
import cn.tds.common.core.*;
import cn.tds.common.domain.*;
import cn.tds.common.domain.Dictionary;
import cn.tds.common.utils.SizeParser;
import cn.tds.common.utils.TdsUtils;
import cn.tds.trading.config.WeChatConfig;
import cn.tds.trading.http.DataCenterJsonClient;
import cn.tds.trading.http.WeChatApiClient;
import cn.tds.trading.repository.*;
import cn.tds.trading.utils.OpenApiParserUtil;
import com.dtflys.forest.http.ForestResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Maps;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.bson.Document;

import java.io.*;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

/**
 * TdsOrderService Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/10 17:06
 */
@Service
@AllArgsConstructor
@Slf4j
public class TdsOrderService {

    private final TdsOrderRepository tdsOrderRepository;

    private final DataSetRepository dataSetRepository;

    private final DataServiceRepository dataServiceRepository;

    private final OidcUserRepository oidcUserRepository;

    private final MongoTemplate mongoTemplate;

    private final TdsEvaluationRepository tdsEvaluationRepository;

    private final OrderDetailRepository orderDetailRepository;

    private final OrderComplaintRepository orderComplaintRepository;

    private final DataCenterRepository dataCenterRepository;

    private final DictRepository dictRepository;

    private final TdsOperationService tdsOperationService;

    private final ConnectorRepository connectorRepository;

    private final TdsDynamicRepository tdsDynamicRepository;

    private final DownloadVoucherRepository downloadVoucherRepository;

    private final TdsWechatNoticeRepository tdsWechatNoticeRepository;

    private final TdsFavoriteRepository tdsFavoriteRepository;

    private final TdsApplyFileRepository tdsApplyFileRepository;

    private final TdsApplyClickRepository tdsApplyClickRepository;

    private final TdsInformationRepository tdsInformationRepository;

    private final AnalysisToolStatisticsRepository analysisToolStatisticsRepository;

    private final TdsAnalysisToolRepository tdsAnalysisToolRepository;

    private final TdsAnalysisToolEvaluationRepository tdsAnalysisToolEvaluationRepository;

    private final DataCenterJsonRepository dataCenterJsonRepository;

    private final DataSetApplyRepository dataSetApplyRepository;

    private final DownloadTokenRepository downloadTokenRepository;

    private final ObjectMapper objectMapper;

    @jakarta.annotation.Resource
    private WeChatApiClient weChatApiClient;

    @jakarta.annotation.Resource
    private DataCenterJsonClient dataCenterJsonClient;

    public OdcResponse pageOrder(int pageNum, int pageSize, String username, String userType, String uid, String businessType, String title, int status) {


//        if (username == null || username.isEmpty() || userType == null || userType.isEmpty()) {
//            OdcUtils.exception().message("参数错误");
//        }

        if (StringUtils.isBlank(uid)) {
            return OdcResponseBuilder.buildFailure("没有authorization");
        }

        log.info(uid);
        log.info("1：{}", uid);

        Query query = new Query();

        OidcUser byUsername = oidcUserRepository.findByUid(uid);

        if (byUsername == null) {
            OdcUtils.exception().message("用户不存在");
        }

//        if (!"tds_admin".equals(byUsername.getType())){
//            query.addCriteria(Criteria.where("uid").is(byUsername.getUid()));
//        }

        if (!byUsername.getAuthorities().contains(TdsProperties.ROLES.ROLE_ADMIN)) {
            query.addCriteria(Criteria.where("uid").is(byUsername.getUid()));
        }


        if (userType != null) {

            switch (userType) {
                case TdsProperties.OrderType.BUYER:
                    query.addCriteria(Criteria.where("buyerUsername").is(username));
                    break;
                case TdsProperties.OrderType.SELLER:
                    query.addCriteria(Criteria.where("sellerUsername").is(username));
                    break;
            }
        }

        if (TdsBusinessType.DATASET.getType().equals(businessType)) {
            query.addCriteria(Criteria.where("type").is(TdsBusinessType.DATASET.getType()));
        }
        if (TdsBusinessType.DATA_SERVICE.getType().equals(businessType)) {
            query.addCriteria(Criteria.where("type").is(TdsBusinessType.DATA_SERVICE.getType()));
        }

        if (title != null) {
            query.addCriteria(Criteria.where("title").regex(title, "i"));
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");

        Pageable pageable = PageRequest.of(pageNum >= 1 ? pageNum - 1 : pageNum, pageSize, sort);

        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsOrder.class, "tds-order"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsOrder.class, "tds-order"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);

    }


    public OdcResponse applicationFile(String uid, Integer type, MultipartFile file) {


        String uuid = UUID.randomUUID().toString();


        //1.检查文件是否为空
        if (file.isEmpty()) {
            OdcUtils.exception().message("文件为空");
        }
        //获取文件名
        String filename = file.getOriginalFilename();

        String contentType = file.getContentType();

        //判断上传文件类型是否为word
        if (!filename.toLowerCase().endsWith(".pdf") || !"application/pdf".equals(contentType)) {
            OdcUtils.exception().message("上传文件类型错误");
        }

        TdsApplyFile tdsApplyFile = new TdsApplyFile();

        tdsApplyFile.setFid(uuid);
        tdsApplyFile.setType(type);
        tdsApplyFile.setCreateAt(new Date());
        tdsApplyFile.setName(filename);
        tdsApplyFile.setUid(uid);

        try {
            // 获取jar包所在目录
            String jarPath = System.getProperty("user.dir");
            // 构建上传目录路径（在jar包同级目录下的uploads文件夹）
            File uploadDir = new File(jarPath, "uploads/apply");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            filename = uuid + "." + filename.substring(filename.lastIndexOf(".") + 1);

            File targetFile = new File(uploadDir, filename);

            tdsApplyFile.setPath(targetFile.getAbsolutePath());

            // 保存文件到指定位置
            file.transferTo(targetFile);
        } catch (IOException e) {
            throw new OdcException(e + "上传文件失败");
        }

        tdsApplyFileRepository.save(tdsApplyFile);

        return OdcResponseBuilder.buildSuccess(uuid);
    }

    public OdcResponse pageApprovalOrder(int pageNum, int pageSize, String uid, String userType, Integer status) {


        if (StringUtils.isBlank(uid)) {
            return OdcResponseBuilder.buildFailure("没有authorization");
        }

        log.info(uid);
        log.info("1：{}", uid);

        Query query = new Query();

        OidcUser oidcUser = oidcUserRepository.findByUid(uid);

        if (oidcUser == null) {
            OdcUtils.exception().message("用户不存在");
        }


        if (TdsProperties.UserType.ORG.equals(oidcUser.getType())) {

            List<Integer> centerPendingApproval = List.of(TdsFairOrderStatus.BUYER_APPLY.getCode(), TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode(), TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode());
            List<Integer> centerApproved = List.of(TdsFairOrderStatus.CENTER_REJECT_APPLY.getCode(), TdsFairOrderStatus.CENTER_AGREE_APPROVE.getCode(), TdsFairOrderStatus.CENTER_REJECT_APPROVE.getCode(), TdsFairOrderStatus.CENTER_AGREE_REJECT.getCode(), TdsFairOrderStatus.CENTER_REJECT_REJECT.getCode());

            query.addCriteria(Criteria.where("centerUid").is(uid));
            if (status == 0) {
                query.addCriteria(Criteria.where("status").in(centerPendingApproval));
            } else if (status == 1) {
                query.addCriteria(Criteria.where("status").in(centerApproved));
            }

        } else {


            List<Integer> buyerPendingApproval = List.of(TdsFairOrderStatus.BUYER_APPLY.getCode(), TdsFairOrderStatus.CENTER_AGREE_APPLY.getCode(), TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode(), TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode(), TdsFairOrderStatus.CENTER_REJECT_REJECT.getCode());

            List<Integer> sellerPendingApproval = List.of(TdsFairOrderStatus.CENTER_AGREE_APPLY.getCode(), TdsFairOrderStatus.CENTER_REJECT_REJECT.getCode());


            if (userType != null) {

                switch (userType) {
                    case TdsProperties.OrderType.BUYER:
                        query.addCriteria(Criteria.where("buyerUid").is(uid));
                        if (status == 0) {
                            query.addCriteria(Criteria.where("status").in(buyerPendingApproval));
                        }
                        break;
                    case TdsProperties.OrderType.SELLER:
                        query.addCriteria(Criteria.where("sellerUid").is(uid));
                        if (status == 0) {
                            query.addCriteria(Criteria.where("status").in(sellerPendingApproval));
                        }
                        break;
                }
            }

        }

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");

        Pageable pageable = PageRequest.of(pageNum >= 1 ? pageNum - 1 : pageNum, pageSize, sort);

        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsOrder.class, "tds-order"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsOrder.class, "tds-order"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);

    }

    public OdcResponse save(OrderRequest orderRequest) {


//        if (orderRequest.getUsername() == null || orderRequest.getUsername().isEmpty() || orderRequest.getCstr() == null || orderRequest.getCstr().isEmpty()) {
//            OdcUtils.exception().message("参数错误");
//        }

        //添加订单
        if (orderRequest.getOpenId() == null || orderRequest.getOpenId().isEmpty() || orderRequest.getCstr() == null || orderRequest.getCstr().isEmpty()) {
            OdcUtils.exception().message("参数错误");
        }

        TdsOrder tdsOrder = new TdsOrder();

//        OidcUser buyer = oidcUserRepository.findByUsername(orderRequest.getUsername());
        OidcUser buyer = oidcUserRepository.findByServiceOpenId(orderRequest.getOpenId());

        if (buyer == null) {
            OdcUtils.exception().message("用户不存在");
        }

        // 校验当天申请次数
        Instant startOfDay = java.time.LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        Instant endOfDay = java.time.LocalDate.now().plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        Query countQuery = new Query();
        countQuery.addCriteria(Criteria.where("buyerUid").is(buyer.getUid()));
        countQuery.addCriteria(Criteria.where("createAt").gte(startOfDay).lt(endOfDay));
        countQuery.addCriteria(Criteria.where("applyType").is(0));
        long todayCount = mongoTemplate.count(countQuery, TdsOrder.class, "tds-order");
        if (todayCount > 10) {
            return OdcResponseBuilder.buildFailure("今天申请次数已超过10次");
        }

        tdsOrder.setBuyerUsername(buyer.getUsername());
        tdsOrder.setBuyerName(buyer.getName());
        tdsOrder.setBuyerUid(buyer.getUid());

        OidcUser seller = null;

        String title = null;

//        if (orderRequest.getType().equals(TdsBusinessType.DATASET.getType())) { //不再需要数据服务

//        DataSet dataSet = dataSetRepository.findByCstr(orderRequest.getCstr());
        DataSet dataSet = dataSetRepository.findTopByCstrOrderByVersionDesc(orderRequest.getCstr());


        if (dataSet == null) {
            OdcUtils.exception().message("数据集不存在");
        }

        tdsOrder.setTitle(dataSet.getTitleZh());
//            tdsOrder.setPrice(dataSet.getPrice());


        if (dataSet.getUid() == null) {
            OdcUtils.exception().message("卖方不存在");
        }

        seller = oidcUserRepository.findByUid(dataSet.getUid());

        title = dataSet.getTitleZh();
//        } else if (orderRequest.getType().equals(TdsBusinessType.DATA_SERVICE.getType())) {
//
//            DataService dataService = dataServiceRepository.findBySid(orderRequest.getCstr());
//
//            if (dataService == null) {
//                OdcUtils.exception().message("数据服务不存在");
//            }
//
//            tdsOrder.setTitle(dataService.getTitle());
//            tdsOrder.setPrice(dataService.getPrice());
//
//
//            if (dataService.getUid() == null) {
//                OdcUtils.exception().message("数据集不存在");
//            }
//
//            seller = oidcUserRepository.findByUid(dataService.getUid());
//
//            title = dataService.getTitle();
//
//
//        } else {
//            OdcUtils.exception().message("参数错误");
//        }

        if (seller == null) {
            OdcUtils.exception().message("卖方不存在");
        }


        tdsOrder.setSellerUsername(seller.getUsername());
        tdsOrder.setSellerName(seller.getName());
        tdsOrder.setSellerUid(seller.getUid());

        if (seller.getUsername().equals(buyer.getUsername())) {
            OdcUtils.exception().message("不能购买自己的数据集");
        }

        OidcUser center = oidcUserRepository.findByUid(dataSet.getSourceId());

        if (center == null) {
            OdcUtils.exception().message("数据中心不存在");
        }

        tdsOrder.setCenterName(center.getName());
        tdsOrder.setCenterUid(center.getUid());
        tdsOrder.setCenterUsername(center.getUsername());
        tdsOrder.setCenterPhone(center.getPhone());


        tdsOrder.setFid(orderRequest.getFid());
        tdsOrder.setApplyType(orderRequest.getApplyType());
        tdsOrder.setStatus(TdsFairOrderStatus.BUYER_APPLY.getCode());
        tdsOrder.setCstr(orderRequest.getCstr());
        tdsOrder.setCreateAt(Instant.now());
        tdsOrder.setUpdateAt(Instant.now());

        tdsOrder.setType(orderRequest.getType());
        tdsOrder.setPurpose(orderRequest.getPurpose());
        tdsOrder.setDescription(orderRequest.getDescription());

        tdsOrder.setOid(TdsUtils.getUid(TdsBusinessType.ORDER));
        tdsOrder.setDeadline(Date.from(ZonedDateTime.now().plusMonths(orderRequest.getDeadline()).toInstant()));
        tdsOrderRepository.save(tdsOrder);

        //发送消息
//        sendApplyTemplateMsg(buyer.getUsername(), title, seller.getServiceOpenId());


        sendToCenterApplyTemplateMsg(buyer.getUsername(), title, center.getServiceOpenId());

        TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
        tdsWechatNotice.setName(buyer.getName());
        tdsWechatNotice.setCstr(orderRequest.getCstr());
        tdsWechatNotice.setDescription("申请访问您的数据集“" + title + "”");
        tdsWechatNotice.setOid(tdsOrder.getOid());
        tdsWechatNotice.setUid(center.getUid());
        tdsWechatNotice.setDescription(orderRequest.getDescription());
        tdsWechatNotice.setStatus(0);
        tdsWechatNotice.setCreateAt(new Date());

        //记录消息
        tdsWechatNoticeRepository.save(tdsWechatNotice);

        //log
        //log.info();(orderRequest);
        log.info("买方{}，卖方{}，订单{}，状态{}", buyer.getUsername(), seller.getUsername(), tdsOrder.getOid(), TdsOrderStatus.SUBMIT);

        orderDetailRepository.save(OrderDetail.builder().oid(tdsOrder.getOid()).username(orderRequest.getUsername()).build());

        tdsOperationService.save(buyer.getUsername(), tdsOrder.getOid(), seller.getUsername(), title, orderRequest.getType(), orderRequest.getCstr(), "提交订单", TdsOrderStatus.SUBMIT.getCode(), buyer.getName() + "购买了" + (orderRequest.getType().equals(TdsBusinessType.DATASET.getType()) ? "数据集" : "数据服务") + "：" + orderRequest.getCstr());


        TdsDynamic tdsDynamic = new TdsDynamic();
        tdsDynamic.setType(TdsProperties.DynamicType.TRANSACTION);
        tdsDynamic.setInfo(buyer.getUsername() + "购买了" + (orderRequest.getType().equals(TdsBusinessType.DATASET.getType()) ? "数据集" : "数据服务") + "：" + orderRequest.getCstr());
        tdsDynamic.setRid(tdsOrder.getOid());
        tdsDynamic.setUpdateAt(Instant.now());
        tdsDynamic.setNodeName(seller.getUsername());
        tdsDynamicRepository.save(tdsDynamic);


        return OdcResponseBuilder.buildSuccess();

    }

    public OdcResponse centerAgreeOrderApply(String oid, int status, String uid, String reason) {

        //todo 权限 知道oid后所有人都能同意
        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (byOid.getStatus() != TdsFairOrderStatus.BUYER_APPLY.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        if (!byOid.getCenterUid().equals(uid)) {
            OdcUtils.exception().message("数据中心错误");
        }


        OidcUser buyer = oidcUserRepository.findByUid(byOid.getBuyerUid());
        OidcUser seller = oidcUserRepository.findByUid(byOid.getSellerUid());


        if (status == 0) {

            byOid.setStatus(TdsFairOrderStatus.CENTER_AGREE_APPLY.getCode());
            byOid.setUpdateAt(Instant.now());
            if (!StringUtils.isBlank(reason)) {
                byOid.setReason(reason);
            }

            tdsOrderRepository.save(byOid);

            TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
            tdsWechatNotice.setName(byOid.getBuyerName());
            tdsWechatNotice.setCstr(byOid.getCstr());
            tdsWechatNotice.setDescription("申请访问您的数据集“" + byOid.getTitle() + "”");
            tdsWechatNotice.setOid(byOid.getOid());
            tdsWechatNotice.setUid(byOid.getSellerUid());
            tdsWechatNotice.setDescription(reason);
            tdsWechatNotice.setStatus(0);
            tdsWechatNotice.setCreateAt(new Date());

            //记录消息
            tdsWechatNoticeRepository.save(tdsWechatNotice);

            //发送消息
            sendApplyTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), seller.getServiceOpenId());

        } else if (status == 1) {


            byOid.setStatus(TdsFairOrderStatus.CENTER_REJECT_APPLY.getCode());
            byOid.setUpdateAt(Instant.now());
            if (!StringUtils.isBlank(reason)) {
                byOid.setReason(reason);
            }

            tdsOrderRepository.save(byOid);

            TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
            tdsWechatNotice.setName(byOid.getCenterName());
            tdsWechatNotice.setCstr(byOid.getCstr());
            tdsWechatNotice.setDescription("拒绝了您的数据集“" + byOid.getTitle() + "”访问申请");
            tdsWechatNotice.setOid(byOid.getOid());
            tdsWechatNotice.setUid(byOid.getBuyerUid());
            tdsWechatNotice.setDescription(reason);
            tdsWechatNotice.setStatus(0);
            tdsWechatNotice.setCreateAt(new Date());

            //记录消息
            tdsWechatNoticeRepository.save(tdsWechatNotice);

            //todo 数据中心拒绝申请消息模板
//            sendFromCenterRejectTemplateMsg(buyer.getName(), byOid.getTitle(), seller.getServiceOpenId(),"****");

        }

        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);


        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(byOid.getSellerUsername()).from(TdsOrderStatus.SUBMIT.getCode()).to(status).content("由订单提交状态改为同意交易或不同意交易").createAt(Instant.now()).build());


        return OdcResponseBuilder.buildSuccess();

    }


    public OdcResponse sellerAgreeOrderApply(String oid, int status, String uid, String reason) {

        //todo 权限 知道oid后所有人都能同意
        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (byOid.getStatus() != TdsFairOrderStatus.CENTER_AGREE_APPLY.getCode() && byOid.getStatus() != TdsFairOrderStatus.CENTER_REJECT_REJECT.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        if (!byOid.getSellerUid().equals(uid)) {
            OdcUtils.exception().message("数据提供方错误");
        }


        OidcUser buyer = oidcUserRepository.findByUid(byOid.getBuyerUid());
        OidcUser seller = oidcUserRepository.findByUid(byOid.getSellerUid());
        OidcUser center = oidcUserRepository.findByUid(byOid.getCenterUid());


        if (status == 0) {

            byOid.setStatus(TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode());
            byOid.setUpdateAt(Instant.now());
            if (!StringUtils.isBlank(reason)) {
                byOid.setReason(reason);
            }

            tdsOrderRepository.save(byOid);

            TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
            tdsWechatNotice.setName(byOid.getSellerName());
            tdsWechatNotice.setCstr(byOid.getCstr());
            tdsWechatNotice.setDescription(byOid.getSellerName() + "同意" + byOid.getBuyerName() + "访问数据集“" + byOid.getTitle() + "”");
            tdsWechatNotice.setOid(byOid.getOid());
            tdsWechatNotice.setUid(byOid.getCenterUid());
            tdsWechatNotice.setDescription(reason);
            tdsWechatNotice.setStatus(0);
            tdsWechatNotice.setCreateAt(new Date());

            //记录消息
            tdsWechatNoticeRepository.save(tdsWechatNotice);

            //发送消息 todo 数据提供方同意申请消息模板
            sendFromSellerAgreeTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getSellerName(), center.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());

        } else if (status == 1) {


            byOid.setStatus(TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode());
            byOid.setUpdateAt(Instant.now());
            if (!StringUtils.isBlank(reason)) {
                byOid.setReason(reason);
            }

            tdsOrderRepository.save(byOid);

            TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
            tdsWechatNotice.setName(byOid.getSellerName());
            tdsWechatNotice.setCstr(byOid.getCstr());
            tdsWechatNotice.setDescription(byOid.getSellerName() + "拒绝" + byOid.getBuyerName() + "访问数据集“" + byOid.getTitle() + "”");
            tdsWechatNotice.setOid(byOid.getOid());
            tdsWechatNotice.setUid(byOid.getCenterUid());
            tdsWechatNotice.setDescription(reason);
            tdsWechatNotice.setStatus(0);
            tdsWechatNotice.setCreateAt(new Date());

            //记录消息
            tdsWechatNoticeRepository.save(tdsWechatNotice);

            //todo 数据提供方拒绝申请消息模板
            sendFromSellerRejectTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getSellerName(), center.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());

        }

        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);


        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(byOid.getSellerUsername()).from(TdsOrderStatus.SUBMIT.getCode()).to(status).content("由订单提交状态改为同意交易或不同意交易").createAt(Instant.now()).build());


        return OdcResponseBuilder.buildSuccess();

    }


    public OdcResponse centerAgreeOrderApproval(String oid, int status, String uid, String reason) {

        //todo 权限 知道oid后所有人都能同意
        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        Set<Integer> excludedStatuses = Set.of(
                TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode(),
                TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode(),
                TdsFairOrderStatus.BUYER_APPLY.getCode()
        );
//        if (!(byOid.getStatus() == TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode() || byOid.getStatus() == TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode()|| byOid.getStatus() == TdsFairOrderStatus.BUYER_APPLY.getCode()))

//        if (byOid.getStatus() != TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode() && byOid.getStatus() != TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode()&& byOid.getStatus() != TdsFairOrderStatus.BUYER_APPLY.getCode())

        if (!excludedStatuses.contains(byOid.getStatus())) {
            OdcUtils.exception().message("订单状态错误");
        }

        if (!byOid.getCenterUid().equals(uid)) {
            OdcUtils.exception().message("数据中心错误");
        }


        OidcUser buyer = oidcUserRepository.findByUid(byOid.getBuyerUid());
        OidcUser seller = oidcUserRepository.findByUid(byOid.getSellerUid());
        OidcUser center = oidcUserRepository.findByUid(byOid.getCenterUid());

        if (byOid.getStatus() == TdsFairOrderStatus.BUYER_APPLY.getCode()) {

            if (status == 0) {

                byOid.setStatus(TdsFairOrderStatus.CENTER_AGREE_APPLY.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getBuyerName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription("申请访问您的数据集“" + byOid.getTitle() + "”");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getSellerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //发送消息 todo 数据中心同意申请消息模板
                sendApplyTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), seller.getServiceOpenId());

            } else if (status == 1) {


                byOid.setStatus(TdsFairOrderStatus.CENTER_REJECT_APPLY.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getCenterName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription("拒绝了您的数据集“" + byOid.getTitle() + "”访问申请");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getBuyerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //todo 数据中心拒绝申请消息模板
                sendFromCenterRejectTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getCenterName(), buyer.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());

            }


        } else if (byOid.getStatus() == TdsFairOrderStatus.SELLER_AGREE_APPROVE.getCode()) {

            if (status == 0) {

                byOid.setStatus(TdsFairOrderStatus.CENTER_AGREE_APPROVE.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getCenterName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription(byOid.getSellerName() + "同意您访问数据集“" + byOid.getTitle() + "”");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getBuyerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //随机生成六位字母数字密码
                String code = RandomStringUtils.randomAlphanumeric(6);


                DownloadVoucher downloadVoucher = new DownloadVoucher();

                downloadVoucher.setCode(code);
                downloadVoucher.setOid(oid);
                downloadVoucher.setCstr(byOid.getCstr());
                downloadVoucher.setBuyerUid(byOid.getBuyerUid());
                downloadVoucher.setSellerUid(byOid.getSellerUid());
                downloadVoucher.setDeadline(byOid.getDeadline());

                downloadVoucherRepository.save(downloadVoucher);


                //发送消息 todo 数据中心同意批准消息模板
                sendApprovalTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), buyer.getServiceOpenId(), code);


            } else if (status == 1) {

                byOid.setStatus(TdsFairOrderStatus.CENTER_REJECT_APPROVE.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getCenterName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription("拒绝了您的数据集“" + byOid.getTitle() + "”访问申请");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getBuyerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //todo 数据中心拒绝批准消息模板
                sendFromCenterRejectTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getCenterName(), buyer.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());

            }

        } else if (byOid.getStatus() == TdsFairOrderStatus.SELLER_REJECT_APPROVE.getCode()) {

            if (status == 0) {

                byOid.setStatus(TdsFairOrderStatus.CENTER_AGREE_REJECT.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getCenterName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription(byOid.getSellerName() + "拒绝" + byOid.getBuyerName() + "访问数据集“" + byOid.getTitle() + "”");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getBuyerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //todo 数据中心同意拒绝消息模板
                sendFromCenterRejectTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getCenterName(), buyer.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());


            } else if (status == 1) {

                byOid.setStatus(TdsFairOrderStatus.CENTER_REJECT_REJECT.getCode());
                byOid.setUpdateAt(Instant.now());
                if (!StringUtils.isBlank(reason)) {
                    byOid.setReason(reason);
                }

                tdsOrderRepository.save(byOid);

                TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
                tdsWechatNotice.setName(byOid.getCenterName());
                tdsWechatNotice.setCstr(byOid.getCstr());
                tdsWechatNotice.setDescription(byOid.getCenterName() + "驳回了您拒绝" + byOid.getBuyerName() + "访问数据集“" + byOid.getTitle() + "”");
                tdsWechatNotice.setOid(byOid.getOid());
                tdsWechatNotice.setUid(byOid.getSellerUid());
                tdsWechatNotice.setDescription(reason);
                tdsWechatNotice.setStatus(0);
                tdsWechatNotice.setCreateAt(new Date());

                //记录消息
                tdsWechatNoticeRepository.save(tdsWechatNotice);

                //todo 数据中心驳回拒绝申请消息模板
                sendFromCenterDismissalTemplateMsg(byOid.getBuyerName(), byOid.getTitle(), byOid.getCenterName(), seller.getServiceOpenId(), byOid.getCreateAt(), byOid.getUpdateAt());

            }

        }

        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);


        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(byOid.getSellerUsername()).from(TdsOrderStatus.SUBMIT.getCode()).to(status).content("由订单提交状态改为同意交易或不同意交易").createAt(Instant.now()).build());


        return OdcResponseBuilder.buildSuccess();

    }


    public OdcResponse agreeOrder(String oid, int status, String uid, String reason) {

        //todo 权限 知道oid后所有人都能同意
        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (byOid.getStatus() != TdsOrderStatus.SUBMIT.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        if (!byOid.getSellerUid().equals(uid)) {
            OdcUtils.exception().message("卖方错误");
        }

        //随机生成六位字母数字密码
        String code = RandomStringUtils.randomAlphanumeric(6);


        DownloadVoucher downloadVoucher = new DownloadVoucher();

        downloadVoucher.setCode(code);
        downloadVoucher.setOid(oid);
        downloadVoucher.setCstr(byOid.getCstr());
        downloadVoucher.setBuyerUid(byOid.getBuyerUid());
        downloadVoucher.setSellerUid(byOid.getSellerUid());
        downloadVoucher.setDeadline(byOid.getDeadline());

        downloadVoucherRepository.save(downloadVoucher);

        OidcUser oidcUser = oidcUserRepository.findByUid(byOid.getBuyerUid());

        sendApprovalTemplateMsg(byOid.getBuyerUsername(), byOid.getTitle(), oidcUser.getServiceOpenId(), code);


        status = status == 9 ? TdsOrderStatus.EXECUTED_TRADE.getCode() : TdsOrderStatus.REFUSE_TRANSACTION.getCode();
        byOid.setStatus(status);
        byOid.setUpdateAt(Instant.now());
        if (!StringUtils.isBlank(reason)) {
            byOid.setReason(reason);
        }


        tdsOrderRepository.save(byOid);

        TdsWechatNotice tdsWechatNotice = new TdsWechatNotice();
        tdsWechatNotice.setName(byOid.getSellerName());
        tdsWechatNotice.setCstr(byOid.getCstr());
        tdsWechatNotice.setDescription("关于“" + byOid.getTitle() + "”的使用申请已批准");
        tdsWechatNotice.setOid(byOid.getOid());
        tdsWechatNotice.setUid(byOid.getBuyerUid());
        tdsWechatNotice.setDescription(reason);
        tdsWechatNotice.setStatus(0);
        tdsWechatNotice.setCreateAt(new Date());


        //记录消息
        tdsWechatNoticeRepository.save(tdsWechatNotice);

        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);


        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(byOid.getSellerUsername()).from(TdsOrderStatus.SUBMIT.getCode()).to(status).content("由订单提交状态改为同意交易或不同意交易").createAt(Instant.now()).build());


        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse pageOrderAll(int pageNum, int pageSize) {

        Query query = new Query();

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");

        Pageable pageable = PageRequest.of(pageNum >= 1 ? pageNum - 1 : pageNum, pageSize, sort);

        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsOrder.class, "tds-order"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsOrder.class, "tds-order"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);
    }

    public OdcResponse findByOid(String oid) {
        return OdcResponseBuilder.buildSuccess(tdsOrderRepository.findByOid(oid));
    }

    public OdcResponse negotiateOrder(String oid, MultipartFile file) {

        TdsOrder tdsOrder = tdsOrderRepository.findByOid(oid);

        //1.检查文件是否为空
        if (file.isEmpty()) {
            OdcUtils.exception().message("文件为空");
        }
        //获取文件名
        String filename = file.getOriginalFilename();

        String contentType = file.getContentType();

        //判断上传文件类型是否为word
        if ((!filename.endsWith(".doc") && !filename.endsWith(".docx")) || (!"application/msword".equals(contentType)) &&
                !"application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) {
            OdcUtils.exception().message("上传文件类型错误");
        }

        try {
            // 获取jar包所在目录
            String jarPath = System.getProperty("user.dir");
            // 构建上传目录路径（在jar包同级目录下的uploads文件夹）
            File uploadDir = new File(jarPath, "uploads/CONTRACT_NEGOTIATION");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            filename = tdsOrder.getOid() + "." + filename.substring(filename.lastIndexOf(".") + 1);

            File targetFile = new File(uploadDir, filename);

            tdsOrder.setContractTemplate(targetFile.getAbsolutePath());

            // 保存文件到指定位置
            file.transferTo(targetFile);
        } catch (IOException e) {
            throw new OdcException(e + "上传文件失败");
        }

        if (tdsOrder == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (tdsOrder.getStatus() != TdsOrderStatus.EXECUTED_TRADE.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }


        tdsOrder.setStatus(TdsOrderStatus.CONTRACT_NEGOTIATION.getCode());
        tdsOrder.setUpdateAt(Instant.now());
        tdsOrderRepository.save(tdsOrder);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(tdsOrder.getSellerUsername()).from(TdsOrderStatus.EXECUTED_TRADE.getCode()).to(TdsOrderStatus.CONTRACT_NEGOTIATION.getCode()).content("卖方上传合同模板").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", tdsOrder.getBuyerUsername(), tdsOrder.getSellerUsername(), tdsOrder.getOid(), TdsOrderStatus.CONTRACT_NEGOTIATION);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse contractOrder(String oid, MultipartFile file) {

        TdsOrder tdsOrder = tdsOrderRepository.findByOid(oid);

        //1.检查文件是否为空
        if (file.isEmpty()) {
            OdcUtils.exception().message("文件为空");
        }
        //获取文件名
        String filename = file.getOriginalFilename();

        String contentType = file.getContentType();

        //判断上传文件类型是否为word
        if ((!filename.endsWith(".pdf")) || (!"application/pdf".equals(contentType))) {
            OdcUtils.exception().message("上传文件类型错误");
        }

        try {
            // 获取jar包所在目录
            String jarPath = System.getProperty("user.dir");
            // 构建上传目录路径（在jar包同级目录下的uploads文件夹）
            File uploadDir = new File(jarPath, "uploads/CONTRACT_COMPLETION");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            filename = tdsOrder.getOid() + "." + filename.substring(filename.lastIndexOf(".") + 1);

            File targetFile = new File(uploadDir, filename);

            tdsOrder.setContract(targetFile.getAbsolutePath());

            // 保存文件到指定位置
            file.transferTo(targetFile);
        } catch (IOException e) {
            throw new OdcException(e + "上传文件失败");
        }

        if (tdsOrder == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (tdsOrder.getStatus() != TdsOrderStatus.CONTRACT_NEGOTIATION.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        tdsOrder.setStatus(TdsOrderStatus.CONTRACT_COMPLETION.getCode());
        tdsOrder.setUpdateAt(Instant.now());
        tdsOrderRepository.save(tdsOrder);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(tdsOrder.getBuyerUsername()).from(TdsOrderStatus.CONTRACT_NEGOTIATION.getCode()).to(TdsOrderStatus.CONTRACT_COMPLETION.getCode()).content("买方上传正式合同").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", tdsOrder.getBuyerUsername(), tdsOrder.getSellerUsername(), tdsOrder.getOid(), TdsOrderStatus.CONTRACT_COMPLETION);

        return OdcResponseBuilder.buildSuccess();

    }

    public OdcResponse contractReview(String oid, int status, String reason) {

        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (byOid.getStatus() != TdsOrderStatus.CONTRACT_COMPLETION.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        status = status == 1 ? TdsOrderStatus.CONTRACT_REVIEW.getCode() : TdsOrderStatus.CONTRACT_NEGOTIATION.getCode();
        byOid.setStatus(status);
        byOid.setUpdateAt(Instant.now());

        tdsOrderRepository.save(byOid);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(byOid.getSellerUsername()).from(TdsOrderStatus.CONTRACT_COMPLETION.getCode()).to(status).content("卖方审核正式合同").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);


        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse platformReview(String oid, int status, String reason) {

        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (byOid.getStatus() != TdsOrderStatus.CONTRACT_REVIEW.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        status = status == 1 ? TdsOrderStatus.PLATFORM_REVIEW.getCode() : TdsOrderStatus.CONTRACT_NEGOTIATION.getCode();
        byOid.setStatus(status);
        byOid.setUpdateAt(Instant.now());
        tdsOrderRepository.save(byOid);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username("平台").from(TdsOrderStatus.CONTRACT_REVIEW.getCode()).to(status).content("平台审核正式合同").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), status);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse payOrder(String oid) {

        TdsOrder byOid = tdsOrderRepository.findByOid(oid);

        if (byOid == null) {
            OdcUtils.exception().message("订单不存在");
        }
        if (byOid.getStatus() != TdsOrderStatus.PLATFORM_REVIEW.getCode()) {
            OdcUtils.exception().message("订单状态错误");
        }

        byOid.setStatus(TdsOrderStatus.PAYMENT_COMPLETED.getCode());
        byOid.setUpdateAt(Instant.now());

        tdsOrderRepository.save(byOid);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username("平台").from(TdsOrderStatus.PLATFORM_REVIEW.getCode()).to(TdsOrderStatus.PAYMENT_COMPLETED.getCode()).content("平台确认付款").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", byOid.getBuyerUsername(), byOid.getSellerUsername(), byOid.getOid(), TdsOrderStatus.PAYMENT_COMPLETED);

        return OdcResponseBuilder.buildSuccess();
    }


    public ResponseEntity<Resource> contractTemplate(String oid) throws IOException {

        TdsOrder order = tdsOrderRepository.findByOid(oid);

        if (order == null || order.getContractTemplate().isEmpty()) {
            OdcUtils.exception().message("订单不存在");
        }

        /* 1. 从库里的全路径直接取文件，避免自己再拼路径和后缀 */
        String fullPath = order.getContractTemplate();   // 存的是 D:.../12345.docx
        Resource resource = new FileSystemResource(new File(fullPath));
        if (!resource.exists()) {
            OdcUtils.exception().message("合同文件已丢失");
        }

        /* 2. 根据真实后缀给出正确 MIME */
        String filename = resource.getFilename();
        MediaType mediaType = filename.toLowerCase().endsWith(".doc") ?
                MediaType.parseMediaType("application/msword") :
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        /* 3. 响应头加双引号，防止中文/空格截断 */
        String encodeName = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20"); // 空格变 %20
        String header = "attachment; filename=\"" + encodeName + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, header)
                .contentLength(resource.contentLength())
                .contentType(mediaType)
                .body(resource);
    }

    public ResponseEntity<Resource> contractDownload(String username, String oid) throws IOException {
        TdsOrder order = tdsOrderRepository.findByOid(oid);

        if (order == null || order.getContract().isEmpty()) {
            OdcUtils.exception().message("订单不存在");
        }

        if (!order.getBuyerUsername().equals(username) && !order.getSellerUsername().equals(username)) {
            OdcUtils.exception().message("无权限");
        }

        /* 1. 从库里的全路径直接取文件，避免自己再拼路径和后缀 */
        String fullPath = order.getContract();   // 存的是 D:.../12345.pdf
        Resource resource = new FileSystemResource(new File(fullPath));
        if (!resource.exists()) {
            OdcUtils.exception().message("合同文件已丢失");
        }

        /* 2. 根据真实后缀给出正确 MIME */
        String filename = resource.getFilename();
        MediaType mediaType = MediaType.parseMediaType(("application/pdf"));

        /* 3. 响应头加双引号，防止中文/空格截断 */
        String encodeName = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20"); // 空格变 %20
        String header = "attachment; filename=\"" + encodeName + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, header)
                .contentLength(resource.contentLength())
                .contentType(mediaType)
                .body(resource);
    }

    public ResponseEntity<Resource> applicationDownload(String uid, String oid) throws IOException {
        TdsOrder order = tdsOrderRepository.findByOid(oid);
        if (order == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (!order.getBuyerUid().equals(uid)
                && !order.getSellerUid().equals(uid)
                && !order.getCenterUid().equals(uid)) {
            OdcUtils.exception().message("无权限");
        }

        String fid = order.getFid();
        if (fid == null || fid.isEmpty()) {
            OdcUtils.exception().message("订单未关联申请表");
        }

        List<TdsApplyFile> applyFiles = tdsApplyFileRepository.findByFid(fid);
        if (applyFiles == null || applyFiles.isEmpty()) {
            OdcUtils.exception().message("申请表不存在");
        }

        TdsApplyFile applyFile = applyFiles.get(0);
        String fullPath = applyFile.getPath();
        if (fullPath == null || fullPath.isEmpty()) {
            OdcUtils.exception().message("申请表文件路径不存在");
        }

        Resource resource = new FileSystemResource(new File(fullPath));
        if (!resource.exists()) {
            OdcUtils.exception().message("申请表文件已丢失");
        }

        String filename = resource.getFilename();
        MediaType mediaType = MediaType.parseMediaType("application/pdf");

        String encodeName = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        String header = "attachment; filename=\"" + encodeName + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, header)
                .contentLength(resource.contentLength())
                .contentType(mediaType)
                .body(resource);
    }

    public void dataDownload(String oid, HttpServletResponse resp) {

        TdsOrder order = tdsOrderRepository.findByOid(oid);
        String url = order.getUrl();

        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(order.getUrl()).openConnection();
            InputStream inputStream = connection.getInputStream();

            resp.setContentType("multipart/from-data");
            ServletOutputStream out = resp.getOutputStream();

            int lenth = 0;
            byte[] buffer = new byte[1024 * 10];
            while ((lenth = inputStream.read(buffer)) != -1) {
                out.write(buffer, 0, lenth);
            }
            // 关闭流
            out.flush();
            out.close();
            inputStream.close();

        } catch (IOException e) {
            throw new OdcException(e.getMessage());
        }
    }

    public ResponseEntity<Resource> dataDownload(String username, String oid) throws IOException {
        TdsOrder order = tdsOrderRepository.findByOid(oid);
        Resource resource = new UrlResource(order.getUrl());

        if (!order.getBuyerUsername().equals(username) && !order.getSellerUsername().equals(username)) {
            OdcUtils.exception().message("无权限");
        }

        if (!resource.exists()) {
            OdcUtils.exception().message("无效的下载地址");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=" + resource.getFilename())
                .contentLength(resource.contentLength())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);

    }

    public OdcResponse updateUrl(String oid, String url) {


        TdsOrder order = tdsOrderRepository.findByOid(oid);

        if (order == null) {
            OdcUtils.exception().message("订单不存在");
        }
        if (order.getStatus() != TdsOrderStatus.PAYMENT_COMPLETED.getCode()) {
            OdcUtils.exception().message("订单状态异常");
        }

        order.setUrl(url);
        order.setStatus(TdsOrderStatus.DOWNLOAD.getCode());
        order.setUpdateAt(Instant.now());
        tdsOrderRepository.save(order);

        orderDetailRepository.save(OrderDetail.builder().oid(oid).username(order.getSellerUsername()).from(TdsOrderStatus.PAYMENT_COMPLETED.getCode()).to(TdsOrderStatus.DOWNLOAD.getCode()).content("卖方更新下载地址").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", order.getBuyerUsername(), order.getSellerUsername(), order.getOid(), TdsOrderStatus.DOWNLOAD);


        return OdcResponseBuilder.buildSuccess();
    }


    @Transactional
    public OdcResponse comment(TdsEvaluation tdsEvaluation) {

        TdsOrder order = tdsOrderRepository.findByOid(tdsEvaluation.getOid());

        if (order == null) {
            OdcUtils.exception().message("订单不存在");
        }
        if (order.getStatus() != TdsOrderStatus.DOWNLOAD.getCode()) {
            OdcUtils.exception().message("订单状态异常");
        }

        tdsEvaluation.setId(null);
        tdsEvaluation.setName(order.getTitle());
        tdsEvaluation.setUsername(tdsEvaluation.getUsername());
        tdsEvaluation.setCstr(order.getCstr());
        tdsEvaluation.setCreateAt(Instant.now());

        order.setStatus(TdsOrderStatus.ORDER_COMPLETED.getCode());
        order.setUpdateAt(Instant.now());

        tdsOrderRepository.save(order);
        tdsEvaluationRepository.save(tdsEvaluation);
        orderDetailRepository.save(OrderDetail.builder().oid(tdsEvaluation.getOid()).username(order.getBuyerUsername()).from(TdsOrderStatus.DOWNLOAD.getCode()).to(TdsOrderStatus.ORDER_COMPLETED.getCode()).content("用户评价").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", order.getBuyerUsername(), order.getSellerUsername(), order.getOid(), TdsOrderStatus.ORDER_COMPLETED);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse getComment(String cstr) {
        List<TdsEvaluation> list = tdsEvaluationRepository.findByCstrOrderByCreateAtDesc(cstr);
        return OdcResponseBuilder.buildSuccess(list);
    }


    public OdcResponse complaint(OrderComplaint orderComplaint) {

        if (orderComplaint == null) {
            OdcUtils.exception().message("参数错误");
        }

        TdsOrder order = tdsOrderRepository.findByOid(orderComplaint.getOid());

        if (order == null) {
            OdcUtils.exception().message("订单不存在");
        }

        if (order.getStatus() != TdsOrderStatus.DOWNLOAD.getCode()) {
            OdcUtils.exception().message("订单状态异常");
        }

        order.setStatus(TdsOrderStatus.COMPLAINT.getCode());

        tdsOrderRepository.save(order);

        orderComplaint.setId(null);
        orderComplaint.setCreateAt(Instant.now());
        orderComplaintRepository.save(orderComplaint);
        orderDetailRepository.save(OrderDetail.builder().oid(orderComplaint.getOid()).username(order.getBuyerUsername()).from(TdsOrderStatus.DOWNLOAD.getCode()).to(TdsOrderStatus.COMPLAINT.getCode()).content("用户投诉").createAt(Instant.now()).build());
        log.info("买方{}，卖方{}，订单{}，状态{}", order.getBuyerUsername(), order.getSellerUsername(), order.getOid(), TdsOrderStatus.COMPLAINT);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse statistics() {
        /* 1. 订单总数 */
        long orderCount = tdsOrderRepository.count();

        /* 2. 完成订单总数 */
        long completeCount = mongoTemplate.count(
                Query.query(Criteria.where("status").is(TdsOrderStatus.ORDER_COMPLETED.getCode())),
                TdsOrder.class);

        /* 3. 成交金额（price 是 String，先转 decimal 再求和） */
        // 3.1 $addFields: priceDecimal = $toDecimal("$price")

        AggregationOperation match = Aggregation.match(
                Criteria.where("status").is(TdsOrderStatus.ORDER_COMPLETED.getCode()));
        AggregationOperation toDecimal = context ->
                new Document("$addFields",
                        new Document("priceDecimal",
                                new Document("$toDecimal", "$price")));

        // 3.2 $group: 求和
        AggregationOperation group = Aggregation.group()
                .sum("priceDecimal")
                .as("t");

        Aggregation agg = Aggregation.newAggregation(match, toDecimal, group);

        BigDecimal totalAmount = Optional.ofNullable(
                        mongoTemplate.aggregate(agg, "tds-order", Document.class)
                                .getUniqueMappedResult())
                .map(doc -> BigDecimal.valueOf(doc.get("t", Number.class).doubleValue()))
                .orElse(BigDecimal.ZERO);

        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));
        long datasetCount = mongoTemplate.count(query, DataSet.class, "tds-dataset");

        long serviceCount = mongoTemplate.count(query, DataService.class, "tds-service");

        /* 4. 组装返回 */
        Map<String, Object> statisticsMap = Map.of(
                "orderCount", orderCount,
                "completeCount", completeCount,
                "totalAmount", totalAmount,
                "datasetCount", datasetCount,
                "serviceCount", serviceCount);

        return OdcResponseBuilder.buildSuccess(statisticsMap);
    }

    public OdcResponse searchOrder(int pageNum, int pageSize, String title) {

        Query query = new Query();

        Pageable pageable = PageRequest.of(pageNum >= 1 ? pageNum - 1 : pageNum, pageSize);

        if (title != null) {
            query.addCriteria(Criteria.where("title").regex(title, "i"));
        }

        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsOrder.class, "tds-order"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsOrder.class, "tds-order"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);
    }

    public OdcResponse dataServicePage(int page, int pageSize, String name, String dataCenterName, String type) {

        Query query = new Query();

        query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));

        if (!StringUtils.isBlank(name)) {
            query.addCriteria(Criteria.where("name").regex(Pattern.compile(name, Pattern.CASE_INSENSITIVE)));
        }

        if (!StringUtils.isBlank(dataCenterName)) {
            query.addCriteria(Criteria.where("dataCenterName").is(dataCenterName));
        }
        if (!StringUtils.isBlank(type)) {
            query.addCriteria(Criteria.where("type").is(type));
        }

        query.with(Sort.by(Sort.Direction.DESC, "createAt"));
        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, DataService.class, "tds-service"));
            put("rows", mongoTemplate.find(query.with(PageRequest.of(page >= 1 ? page - 1 : page, pageSize)), DataService.class, "tds-service"));
        }};
        return OdcResponseBuilder.buildSuccess(userMap);


    }

    public OdcResponse datasetPage(int page, int pageSize, String titleZh, String dataCenterName, String subject, String source, String shareMode, String sort) {
        Query query = new Query();


        query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));

        if (!StringUtils.isBlank(dataCenterName)) {
            query.addCriteria(Criteria.where("dataCenterName").is(dataCenterName));
        }
        if (!StringUtils.isBlank(subject)) {
//            query.addCriteria(Criteria.where("subject").is(subject));
            query.addCriteria(Criteria.where("subject").regex(Pattern.compile(subject, Pattern.CASE_INSENSITIVE)));
        }

        if (!StringUtils.isBlank(source)) {
            query.addCriteria(Criteria.where("source").is(source));
        }


        if (!StringUtils.isBlank(titleZh)) {
            query.addCriteria(Criteria.where("titleZh").regex(Pattern.compile(titleZh, Pattern.CASE_INSENSITIVE)));
        }

        if (!StringUtils.isBlank(shareMode)) {
            query.addCriteria(Criteria.where("shareMode").is(shareMode));
        }

        List<Sort.Order> orders = new ArrayList<>();
        orders.add(new Sort.Order(Sort.Direction.DESC, "isAiExploration"));
        if (StringUtils.isNotBlank(sort)) {
            orders.add(new Sort.Order(Sort.Direction.DESC, sort));
        }
        Sort sortObj = Sort.by(orders);
        query.with(sortObj);

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);

        int skip = page >= 1 ? page - 1 : page;
        Document sortDoc = new Document(sort, -1);
        log.info("db.getCollection(\"tds-dataset\").find({}).sort({}).skip({}).limit({})",
                query.getQueryObject().toJson(),
                sortDoc.toJson(),
                skip * pageSize,
                pageSize);

        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, DataSet.class, "tds-dataset"));
            put("rows", mongoTemplate.find(query.with(pageable), DataSet.class, "tds-dataset"));
        }};

        return OdcResponseBuilder.buildSuccess(userMap);
    }

    public OdcResponse datasetDetail(String cstr) {

//        DataSet byCstr = dataSetRepository.findByCstr(cstr);
        DataSet byCstr = dataSetRepository.findTopByCstrOrderByVersionDesc(cstr);

        AccessConnector connector = null;

        if (byCstr != null) {
//            byUid = oidcUserRepository.findByUid(byCstr.getUid());
            connector = connectorRepository.findByUid(byCstr.getUid());

            byCstr.setViewCount(byCstr.getViewCount() + 1);
            dataSetRepository.save(byCstr);
        }


        return OdcResponseBuilder.buildSuccess(Map.of("DataSet", byCstr, "email", connector != null ? connector.getEmail() : ""));
    }

    public OdcResponse dataServiceDetail(String sid) {
        return OdcResponseBuilder.buildSuccess(dataServiceRepository.findBySid(sid));
    }

    public OdcResponse apiList(String sid) {

        DataService dataService = dataServiceRepository.findBySid(sid);
        String apiDocUrl = dataService.getApiDocUrl();

        if (StringUtils.isBlank(apiDocUrl)) {
//            throw new OdcException("apiDocUrl 不能为空");
            return OdcResponseBuilder.buildSuccess();
        }

        // 解析 + 异常转译
        List<ApiInfo> apiInfos;
        try {
            apiInfos = OpenApiParserUtil.parser(apiDocUrl);
            //todo 目前只能一个服务一个接口，后续考虑通过path进行匹配
        } catch (Exception e) {
            throw new OdcException("文档解析失败: " + e.getMessage());
        }

        return OdcResponseBuilder.buildSuccess(apiInfos);

    }

    public OdcResponse datacenterDatasetStatistics() {
        Aggregation agg = Aggregation.newAggregation(
                match(
                        Criteria.where("source").ne(null)
                                .and("status").is(TdsStatus.APPROVE.getCode())
                ),
                group("source")
                        .count().as("datesetNumber"),
//                        .sum("byteSize").as("byteSize"),
                sort(Sort.by(Sort.Direction.DESC, "datesetNumber")),  // 倒序
                limit(10)                                              // 取前 10
        );

        // 1. 执行
        AggregationResults<Document> result =
                mongoTemplate.aggregate(agg, "tds-dataset", Document.class);

        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
    }

//    public OdcResponse subjectDatasetStatistics() {
//        Aggregation agg = Aggregation.newAggregation(
//                match(Criteria.where("subject").ne(null)
//                        .and("status").is(TdsStatus.APPROVE.getCode())),
//                group("subject")
//                        .count().as("datesetNumber"),
////                        .sum("byteSize").as("byteSize"),
//                sort(Sort.by(Sort.Direction.DESC, "datesetNumber"))  // 倒序
////                limit(10)                                              // 取前 10
//        );
//
//        // 1. 执行
//        AggregationResults<Document> result =
//                mongoTemplate.aggregate(agg, "tds-dataset", Document.class);
//
//        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
//    }

    public OdcResponse subjectDatasetStatistics() {
        List<Document> pipeline = Arrays.asList(
                new Document("$match", new Document("status", TdsStatus.APPROVE.getCode())
                        .append("subject", new Document("$nin", Arrays.asList(null, "")))),

                new Document("$project", new Document("firstLevelSubjects",
                        new Document("$function", new Document()
                                .append("lang", "js")
                                .append("args", Collections.singletonList("$subject"))
                                .append("body", """
                                        function(subjectStr) {
                                            try {
                                                var arr = JSON.parse(subjectStr);
                                                if (!Array.isArray(arr)) return [];
                                                var codeSet = {};
                                                var names = {};
                                                for (var i = 0; i < arr.length; i++) {
                                                    var code = arr[i].code;
                                                    if (!code || code.length < 3) continue;
                                                    var first = code.length === 3 ? code : code.substring(0, 3);
                                                    codeSet[first] = true;
                                                    if (code.length === 3 && arr[i].nameZh) {
                                                        names[first] = arr[i].nameZh;
                                                    }
                                                }
                                                var result = [];
                                                for (var c in codeSet) {
                                                    result.push({ code: c, nameZh: names[c] || "" });
                                                }
                                                return result;
                                            } catch (e) {
                                                return [];
                                            }
                                        }
                                        """)))),

                new Document("$unwind", "$firstLevelSubjects"),

                new Document("$group", new Document("_id", "$firstLevelSubjects.code")
                        .append("nameZh", new Document("$max", "$firstLevelSubjects.nameZh"))
                        .append("datesetNumber", new Document("$sum", 1))),

                new Document("$project", new Document("code", "$_id")
                        .append("nameZh", 1)
                        .append("datesetNumber", 1)
                        .append("_id", 0)),

                new Document("$sort", new Document("datesetNumber", -1))
        );

        AggregationResults<Document> result =
                mongoTemplate.aggregate(
                        Aggregation.newAggregation(
                                pipeline.stream()
                                        .map(doc -> (AggregationOperation) context -> doc)
                                        .toArray(AggregationOperation[]::new)
                        ),
                        "tds-dataset",
                        Document.class
                );

        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
    }

    public OdcResponse topicDatasetStatistics() {
        Aggregation agg = Aggregation.newAggregation(
                match(Criteria.where("topic").ne(null)
                        .and("status").is(TdsStatus.APPROVE.getCode())),
                group("topic")
                        .count().as("datesetNumber"),
//                        .sum("byteSize").as("byteSize"),
                sort(Sort.by(Sort.Direction.DESC, "datesetNumber")),  // 倒序
                limit(10)                                              // 取前 10
        );

        // 1. 执行
        AggregationResults<Document> result =
                mongoTemplate.aggregate(agg, "tds-dataset", Document.class);

        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
    }

    public OdcResponse datacenterDataServiceStatistics() {

        Aggregation agg = Aggregation.newAggregation(
                match(Criteria.where("data_center_name").ne(null)
                        .and("status").is(TdsStatus.APPROVE.getCode())),
                group("data_center_name")
                        .count().as("dateServiceNumber")
        );

        // 1. 执行
        AggregationResults<Document> result =
                mongoTemplate.aggregate(agg, "tds-service", Document.class);

        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
    }

    public OdcResponse typeDataServiceStatistics() {
        Aggregation agg = Aggregation.newAggregation(
                match(Criteria.where("type").ne(null)
                        .and("status").is(TdsStatus.APPROVE.getCode())),
                group("type")
                        .count().as("dateServiceNumber")
        );

        // 1. 执行
        AggregationResults<Document> result =
                mongoTemplate.aggregate(agg, "tds-service", Document.class);

        return OdcResponseBuilder.buildSuccess(result.getMappedResults());
    }

    /**
     * 通过字典构建前端下拉框数据
     *
     * @param code 字典类型
     * @return OdcResponse
     */
    public OdcResponse getSelect(String code) {
        Dictionary byCode = dictRepository.findByCode(code);

        List<Map<String, String>> options = byCode.getDictData().stream().map(dict -> {
            Map<String, String> temp = Maps.newHashMap();
            temp.put("value", dict.getDataKey());
            temp.put("label", dict.getDataValue());
            return temp;
        }).collect(Collectors.toList());

        return OdcResponseBuilder.buildSuccess(options);
    }

    public OdcResponse datasetTop() {

        Query query = new Query();


        query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));
        query.with(Sort.by(Sort.Direction.DESC, "downloadCount"));
        query.limit(6);
        List<DataSet> dataSetList = mongoTemplate.find(query, DataSet.class, "tds-dataset");
        return OdcResponseBuilder.buildSuccess(dataSetList);
    }

    public OdcResponse connectorPage(int page, int pageSize) {

        Query query = new Query();

        query.with(Sort.by(Sort.Direction.DESC, "createDate"));
        query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);

        List<AccessConnector> connectorList = mongoTemplate.find(query.with(pageable), AccessConnector.class, "tds-connector");
        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, AccessConnector.class, "tds-connector"));
            put("rows", TdsUtils.desensitizing(connectorList));
        }};

        return OdcResponseBuilder.buildSuccess(userMap);
    }

    public OdcResponse datacenterDatasetStatistics(String dataCenterName) {
        return OdcResponseBuilder.buildSuccess(dataCenterRepository.findByDataCenterName(dataCenterName));
    }

    //定时任务，每天一次
    @Scheduled(cron = "0 0 0 1/1 * ? ")
    public void datasetStatisticsByConnector() {

        // 1. 构建【字符串转长整型】的聚合操作（核心：兼容4.5.4版本）
        AggregationOperation convertByteSize = new AggregationOperation() {
            @Override
            public Document toDocument(AggregationOperationContext context) {
                // 构建 $addFields 操作：将字符串类型的 byteSize 转为 long
                Document addFieldsDoc = new Document();

                // 构建 $convert 表达式（处理字符串转数值）
                Document convertExpr = new Document();
                convertExpr.put("input", "$byteSize"); // 原始字符串字段
                convertExpr.put("to", "long");         // 目标类型：长整型
                convertExpr.put("onError", 0);         // 转换失败设0
                convertExpr.put("onNull", 0);          // 字段为null设0

                // 组合 $addFields：新增 byteSizeNum 字段存储转换后的值
                addFieldsDoc.put("byteSizeNum", new Document("$convert", convertExpr));
                return new Document("$addFields", addFieldsDoc);
            }
        };

        // 2. 完整聚合管道
        Aggregation agg = Aggregation.newAggregation(
                // 筛选条件：source非空 + status=9
                Aggregation.match(Criteria.where("source").ne(null).and("status").is(TdsStatus.APPROVE.getCode())),
                // 转换 byteSize 字符串为数值
                convertByteSize,
                // 分组聚合：按source统计数量和字节总和
                Aggregation.group("source")
                        .count().as("datesetNumber")
                        .sum("byteSizeNum").as("byteSize"),
                // 美化返回结果：_id → source，移除默认_id
                Aggregation.project("datesetNumber", "byteSize")
                        .and("_id").as("source")
                        .andExclude("_id")
        );

        // 3. 执行聚合
        AggregationResults<Document> result = mongoTemplate.aggregate(
                agg,
                "tds-dataset",  // 集合名
                Document.class  // 返回类型
        );

        // 4. 获取结果并返回
        List<Document> data = result.getMappedResults();

        // 2. 直接输出
        result.getMappedResults().forEach(d -> {

                    System.out.printf("数据中心：%s，数据集数量：%s，总字节数：%s%n",
                            d.get("source"),              // 直接 get(key)
                            d.get("datesetNumber"),
                            d.get("byteSize"));

                    String center = (String) d.get("source");
                    Integer num = (Integer) d.get("datesetNumber");
                    Long size = (Long) d.get("byteSize");

//                    DataCenter dataCenter = new DataCenter();
//                    dataCenter.setDataCenterName(center);
//                    dataCenter.setDatesetNumber(num);
//                    dataCenter.setByteSize(size);

                    // 1. 组装条件
                    Query query = new Query();
                    query.addCriteria(Criteria.where("name").is(center));

// 2. 要更新的字段
                    Update update = new Update()
                            .set("dateset_number", num)
                            .set("byte_size", size)
                            .set("updateDate", Instant.now());

// 3. 执行
                    mongoTemplate.updateFirst(query, update, AccessConnector.class);

                    log.info(data + "");
                    log.info((String) d.get("source"));
                }
        );

    }

    public OdcResponse dynamicGet() {
        return OdcResponseBuilder.buildSuccess(tdsDynamicRepository.findTop10ByOrderByUpdateAtDesc());
    }

    public OdcResponse homePageStatistics() {


        Aggregation agg = Aggregation.newAggregation(
                Aggregation.project()
                        .and(ConvertOperators.Convert.convertValueOf("$byteSize").to("long"))
                        .as("sizeNum"),
                Aggregation.group()
                        .sum("sizeNum").as("total")
        );

        Document doc = mongoTemplate.aggregate(agg, "tds-dataset", Document.class)
                .getUniqueMappedResult();


        HashMap<String, Object> map = new HashMap<>() {{
            put("dataNode", connectorRepository.count());
            put("datasetNumber", dataSetRepository.count());
            put("totalDataVolume", SizeParser.fromBytes(doc == null ? 0L : doc.getLong("total")));
            put("userNumber", oidcUserRepository.count());
            put("activityLevel", 12410);
            put("dateTime", DateUtils.format(Instant.now(), DateUtils.CHINESE_DATE_PATTERN));
        }};
        return OdcResponseBuilder.buildSuccess(map);
    }

    public OdcResponse shareModeDatasetStatistics() {

        List<HashMap<String, Object>> list = new ArrayList<>();

        dictRepository.findByCode("sharing-method").getDictData().forEach(data -> {

            Query query = new Query();
            query.addCriteria(Criteria.where("shareMode").is(data.getDataValue()));
            query.addCriteria(Criteria.where("status").is(TdsStatus.APPROVE.getCode()));

            HashMap<String, Object> map = new HashMap<>();
            map.put("shareMode", data.getDataValue());
            map.put("total", mongoTemplate.count(query, DataSet.class, "tds-dataset"));
            list.add(map);
        });

        return OdcResponseBuilder.buildSuccess(list);
    }

    public OdcResponse getDynamicTransaction(int page, int pageSize) {

        Query query = new Query();

        query.with(Sort.by(Sort.Direction.DESC, "updateAt"));

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);

        query.addCriteria(Criteria.where("type").is(TdsProperties.DynamicType.TRANSACTION));

        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsDynamic.class, "tds-dynamic"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsDynamic.class, "tds-dynamic"));
        }};

        return OdcResponseBuilder.buildSuccess(userMap);

    }

    public OdcResponse getDynamicDataset(int page, int pageSize) {
        Query query = new Query();
        query.with(Sort.by(Sort.Direction.DESC, "updateAt"));
        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        query.addCriteria(Criteria.where("type").is(TdsProperties.DynamicType.DATASET));
        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsDynamic.class, "tds-dynamic"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsDynamic.class, "tds-dynamic"));
        }};
        return OdcResponseBuilder.buildSuccess(userMap);
    }

    public OdcResponse openDomainDatasetStatistics() {

        List<AccessConnector> connectorList = connectorRepository.findAccessConnectorByTopic("开放域");

        List<String> collect = connectorList.stream().map(AccessConnector::getName).collect(Collectors.toList());

        long count = mongoTemplate.count(Query.query(Criteria.where("source").in(collect)), DataSet.class, "tds-dataset");


        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", count);
            put("name", "开放域");
        }};
        return OdcResponseBuilder.buildSuccess(userMap);
    }

    public ResponseEntity<Resource> fileDownload(String cstr, String code, String uid) throws IOException {

        Query query = new Query();
        query.addCriteria(Criteria.where("cstr").is(cstr));
        query.addCriteria(Criteria.where("code").is(code));
        query.addCriteria(Criteria.where("buyerUid").is(uid));
        DownloadVoucher one = mongoTemplate.findOne(query, DownloadVoucher.class, "download-voucher");

        if (one == null) {
            OdcUtils.exception().message("凭证不存在");
        }


//        String directory = "E:\\project\\file\\" + cstr;
        String directory = "/mnt/data/file/" + cstr;
        File dir = new File(directory);

        log.info("尝试下载文件，cstr: {}, 目录路径: {}", cstr, dir.getAbsolutePath());

        if (!dir.exists() || !dir.isDirectory()) {
            log.error("文件目录不存在: {}", dir.getAbsolutePath());
            OdcUtils.exception().message("文件目录不存在: " + directory);
        }

        File[] files = dir.listFiles((d, name) -> name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".tar.gz"));

        if (files == null || files.length == 0) {
            log.error("目录中未找到压缩包文件: {}", directory);
            OdcUtils.exception().message("压缩包文件不存在");
        }

        File zipFile = files[0];
        log.info("找到压缩包文件: {}", zipFile.getAbsolutePath());

        Resource resource = new FileSystemResource(zipFile);

        if (!resource.exists()) {
            OdcUtils.exception().message("文件不存在");
        }

        String filename = resource.getFilename();
        String encodeName = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        String header = "attachment; filename=\"" + encodeName + "\"; filename*=UTF-8''" + encodeName;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, header)
                .contentLength(resource.contentLength())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    /**
     * 获取access_token
     */
    private String getAccessToken() {
        ForestResponse<Map> response = weChatApiClient.getAccessToken(
                "client_credential", WeChatConfig.WECHAT_APPID, WeChatConfig.WECHAT_SECRET
        );

        if (response.isSuccess() && response.getResult() != null) {
            Map<String, Object> result = response.getResult();
            return (String) result.get("access_token");
        }
        return null;
    }

    /**
     * 发送模板消息
     */
    public void sendApplyTemplateMsg(String name, String title, String openId) {
        String templateId = "APXLXIlY-WGgwg0_TOmE92NREJO8O80fKcRKDkjew4c";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "你有新的数据集使用申请");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", name);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", new Date().toString());
        data.put("keyword3", keyword3);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请前往后台审核");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    private void sendFromCenterDismissalTemplateMsg(String applyName, String title, String approvalName, String openId, Instant applyTime, Instant optionTime) {
        String templateId = "9jZCmlDXPlPnsd5ucE_c-G-j7MytozJhaQdj_d7QREk";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        LocalDate applyTimeDate = applyTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();
        LocalDate optionTimeDate = optionTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "数据中心驳回拒绝");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", applyName);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", applyTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", approvalName);
        data.put("keyword4", keyword4);

        Map<String, String> keyword5 = new HashMap<>();
        keyword5.put("value", optionTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword5", keyword5);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请尽快处理");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    private void sendFromCenterRejectTemplateMsg(String applyName, String title, String approvalName, String openId, Instant applyTime, Instant optionTime) {
        String templateId = "hYCjC22a2c9h8H8qDGdDSSyVqpQ41CmflQvLQCz_r50";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        LocalDate applyTimeDate = applyTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();
        LocalDate optionTimeDate = optionTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "数据中心拒绝申请");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", applyName);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", applyTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", approvalName);
        data.put("keyword4", keyword4);

        Map<String, String> keyword5 = new HashMap<>();
        keyword5.put("value", optionTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword5", keyword5);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请尽快处理");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }


    public void sendToCenterApplyTemplateMsg(String name, String title, String openId) {
        String templateId = "APXLXIlY-WGgwg0_TOmE92NREJO8O80fKcRKDkjew4c";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "你有新的数据集使用申请");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", name);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", new Date().toString());
        data.put("keyword3", keyword3);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请前往后台审核");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public void sendFromSellerAgreeTemplateMsg(String applyName, String title, String approvalName, String openId, Instant applyTime, Instant optionTime) {
        String templateId = "WdF0xo7MwWcNZKlLnXs6Xep6sVEvdWk_RWe9PdRGBS0";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        LocalDate applyTimeDate = applyTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();
        LocalDate optionTimeDate = optionTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();


        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "数据提供方批准申请");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", applyName);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", applyTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", approvalName);
        data.put("keyword4", keyword4);

        Map<String, String> keyword5 = new HashMap<>();
        keyword5.put("value", optionTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword5", keyword5);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请尽快处理");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public void sendFromSellerRejectTemplateMsg(String applyName, String title, String approvalName, String openId, Instant applyTime, Instant optionTime) {
        String templateId = "oZQeYr-LAvcyCvHM0t3SS0YZ0qLkGflt_HW5lctlY_8";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        LocalDate applyTimeDate = applyTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();
        LocalDate optionTimeDate = optionTime.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "数据提供方拒绝申请");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", applyName);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", applyTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", approvalName);
        data.put("keyword4", keyword4);

        Map<String, String> keyword5 = new HashMap<>();
        keyword5.put("value", optionTimeDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
        data.put("keyword5", keyword5);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请尽快处理");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public void sendApprovalTemplateMsg(String name, String title, String openId, String code) {
        String templateId = "9_y3XJf4wrjdtSo0xD1XxhYej2jXwyKEEOFonevUYnw";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "您的数据集申请已审批通过");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", name);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", new Date().toString());
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", "审批通过");
        data.put("keyword4", keyword4);

        Map<String, String> keyword5 = new HashMap<>();
        keyword5.put("value", code);
        data.put("keyword5", keyword5);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请保存授权码，前往小程序下载数据集");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", "https://REPLACE_WITH_EXTERNAL_CONFIG/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }


    public void sendcontinueTemplateMsg(String name, String title, String openId, String reason) {
        String templateId = "VLKL1kKOH6LPy-MsxhYrPQxARc7YjpZXzVy7uythOes";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> first = new HashMap<>();
        first.put("value", "您的数据集申请需要进一步沟通");
        data.put("first", first);

        Map<String, String> keyword1 = new HashMap<>();
        keyword1.put("value", name);
        data.put("keyword1", keyword1);

        Map<String, String> keyword2 = new HashMap<>();
        keyword2.put("value", title);
        data.put("keyword2", keyword2);

        Map<String, String> keyword3 = new HashMap<>();
        keyword3.put("value", new Date().toString());
        data.put("keyword3", keyword3);

        Map<String, String> keyword4 = new HashMap<>();
        keyword4.put("value", reason);
        data.put("keyword4", keyword4);

        Map<String, String> remark = new HashMap<>();
        remark.put("value", "请保持沟通");
        data.put("remark", remark);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
//        requestBody.put("url", "https://omni-space.cn/wechat-miniprogram.html");
        requestBody.put("data", data);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public OdcResponse getDataSetByUid(String uid, int page, int pageSize, Integer status) {

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");
        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize, sort);

        Query query = new Query();
        query.addCriteria(Criteria.where("uid").is(uid));

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, DataSet.class, "tds-dataset"));
            put("rows", mongoTemplate.find(query.with(pageable), DataSet.class, "tds-dataset"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);
    }

    public OdcResponse continueOrder(String oid, String reason) {

        TdsOrder tdsOrder = tdsOrderRepository.findByOid(oid);

        if (tdsOrder == null) {
            OdcUtils.exception().message("订单不存在");
        }

        OidcUser oidcUser = oidcUserRepository.findByUid(tdsOrder.getBuyerUid());

        sendcontinueTemplateMsg(oidcUser.getName(), tdsOrder.getTitle(), oidcUser.getServiceOpenId(), reason);
        return OdcResponseBuilder.buildSuccess();
    }


    public OdcResponse noticeByUid(String uid, int page, int pageSize) {

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");
        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize, sort);

        Query query = new Query();
        query.addCriteria(Criteria.where("uid").is(uid));

        HashMap<String, Object> noticeMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsWechatNotice.class, "tds-wechat-notice"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsWechatNotice.class, "tds-wechat-notice"));
        }};

        return OdcResponseBuilder.buildSuccess(noticeMap);
    }

    // ==================== 收藏功能 ====================

    public OdcResponse addFavorite(String uid, String cstr) {
        if (uid == null || cstr == null) {
            throw new OdcException("参数错误");
        }

        Optional<TdsFavorite> existing = tdsFavoriteRepository.findByUidAndCstr(uid, cstr);
        if (existing.isPresent()) {
            return OdcResponseBuilder.buildSuccess("已收藏");
        }

//        DataSet dataSet = dataSetRepository.findByCstr(cstr);
        DataSet dataSet = dataSetRepository.findTopByCstrOrderByVersionDesc(cstr);
        if (dataSet == null) {
            throw new OdcException("数据集不存在");
        }

        TdsFavorite favorite = new TdsFavorite();
        favorite.setUid(uid);
        favorite.setCstr(cstr);
        favorite.setName(dataSet.getTitleZh());
        favorite.setSource(dataSet.getSource());
        favorite.setCreateAt(Instant.now());
        tdsFavoriteRepository.save(favorite);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse removeFavorite(String uid, String cstr) {
        tdsFavoriteRepository.deleteByUidAndCstr(uid, cstr);
        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse pageFavorites(String uid, int page, int pageSize) {
        Query query = new Query(Criteria.where("uid").is(uid));
        query.with(Sort.by(Sort.Direction.DESC, "createAt"));

        long total = mongoTemplate.count(query, TdsFavorite.class, "tds-favorite");

        PageRequest pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        List<TdsFavorite> favorites = mongoTemplate.find(query.with(pageable), TdsFavorite.class, "tds-favorite");

        List<String> cstrList = favorites.stream()
                .map(TdsFavorite::getCstr)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<DataSet> dataSets;
        if (!cstrList.isEmpty()) {
            Query dsQuery = new Query(Criteria.where("cstr").in(cstrList));
            dataSets = mongoTemplate.find(dsQuery, DataSet.class, "tds-dataset");
        } else {
            dataSets = Collections.emptyList();
        }

        Map<String, DataSet> dsMap = dataSets.stream()
                .collect(Collectors.toMap(DataSet::getCstr, ds -> ds));

        List<Map<String, Object>> rows = favorites.stream().map(fav -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("favoriteId", fav.getId());
            item.put("createAt", fav.getCreateAt());
            item.put("cstr", fav.getCstr());
            item.put("dataset", dsMap.get(fav.getCstr()));
            return item;
        }).collect(Collectors.toList());

        HashMap<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("rows", rows);
        return OdcResponseBuilder.buildSuccess(result);
    }

    public OdcResponse checkFavorited(String uid, String cstr) {
        boolean exists = tdsFavoriteRepository.findByUidAndCstr(uid, cstr).isPresent();
        return OdcResponseBuilder.buildSuccess(Map.of("favorited", exists));
    }

    // ==================== 评价功能 ====================

    public OdcResponse saveEvaluation(String uid, String cstr, String description, double score) {
        if (uid == null || cstr == null) {
            throw new OdcException("参数错误");
        }

//        DataSet dataSet = dataSetRepository.findByCstr(cstr);
        DataSet dataSet = dataSetRepository.findTopByCstrOrderByVersionDesc(cstr);
        if (dataSet == null) {
            throw new OdcException("数据集不存在");
        }

        OidcUser byUid = oidcUserRepository.findByUid(uid);

        TdsEvaluation evaluation = new TdsEvaluation();
        evaluation.setUid(uid);
        evaluation.setCstr(cstr);
        evaluation.setSource(dataSet.getSource());
        evaluation.setName(dataSet.getTitleZh());
        evaluation.setUsername(byUid.getName());
        evaluation.setDescription(description);
        evaluation.setScore(score);
        evaluation.setCreateAt(Instant.now());
        tdsEvaluationRepository.save(evaluation);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse getDatasetEvaluations(String cstr) {
        return OdcResponseBuilder.buildSuccess(tdsEvaluationRepository.findByCstrOrderByCreateAtDesc(cstr));
    }

    public OdcResponse getUserEvaluations(String uid, int page, int pageSize) {
        Query query = new Query(Criteria.where("uid").is(uid));
        query.with(Sort.by(Sort.Direction.DESC, "createAt"));

        long total = mongoTemplate.count(query, TdsEvaluation.class, "tds-evaluation");

        PageRequest pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        List<TdsEvaluation> list = mongoTemplate.find(query.with(pageable), TdsEvaluation.class, "tds-evaluation");

        HashMap<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("rows", list);
        return OdcResponseBuilder.buildSuccess(result);
    }

    public OdcResponse batchApproveDataSet(List<String> cstrList) {
        if (cstrList == null || cstrList.isEmpty()) {
            throw new OdcException("cstr集合不能为空");
        }
        Query query = new Query(Criteria.where("cstr").in(cstrList));
        Update update = new Update()
                .set("status", TdsStatus.APPROVE.getCode())
                .set("updateAt", Instant.now());
        mongoTemplate.updateMulti(query, update, DataSet.class, "tds-dataset");
        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse hasUnpublished(String uid) {

        //查询是否存在status不为9的数据集
        Query query = new Query(Criteria.where("uid").is(uid).and("status").ne(9));
        long count = mongoTemplate.count(query, DataSet.class, "tds-dataset");


        return OdcResponseBuilder.buildSuccess(count);
    }

    public OdcResponse hasUnreadNotice(String uid) {
        Query query = new Query(Criteria.where("uid").is(uid).and("status").is(0));
        long count = mongoTemplate.count(query, TdsWechatNotice.class, "tds-wechat-notice");
        return OdcResponseBuilder.buildSuccess(count);
    }

    public OdcResponse singlerRead(String uid, String noticeId) {

        Query query = new Query(Criteria.where("id").is(noticeId).and("uid").is(uid));
        Update update = new Update().set("status", 1);
        mongoTemplate.updateFirst(query, update, TdsWechatNotice.class, "tds-wechat-notice");
        return OdcResponseBuilder.buildSuccess();
    }


    public OdcResponse globalRead(String uid) {

        Query query = new Query(Criteria.where("uid").is(uid).and("status").is(0));
        Update update = new Update().set("status", 1);
        mongoTemplate.updateMulti(query, update, TdsWechatNotice.class, "tds-wechat-notice");
        return OdcResponseBuilder.buildSuccess();
    }


    public OdcResponse hasKst(String uid) {

        Query query = new Query();
        query.addCriteria(Criteria.where("uid").is(uid));
        query.addCriteria(Criteria.where("type").is(1));

        long count = mongoTemplate.count(query, TdsApplyFile.class, "tds-apply-file");
        return count > 0 ? OdcResponseBuilder.buildSuccess() : OdcResponseBuilder.buildFailure("用户首次使用快数通");

    }

    public OdcResponse applyClick(String uid, String cstr, String url) {

        TdsApplyClick tdsApplyClick = new TdsApplyClick();

        tdsApplyClick.setUid(uid);
        tdsApplyClick.setCstr(cstr);
        tdsApplyClick.setUrl(url);
        tdsApplyClick.setCreateAt(new Date());

        tdsApplyClickRepository.save(tdsApplyClick);

        return OdcResponseBuilder.buildSuccess();

    }

    public OdcResponse getDownloadUrl(String cstr) {

        //根据cstr查询DataSetFile集合
        Query query = new Query(Criteria.where("cstr").is(cstr));
        List<DataSetFile> dataSetFiles = mongoTemplate.find(query, DataSetFile.class, "tds-dataset-file");
        return OdcResponseBuilder.buildSuccess(dataSetFiles);

    }

    public OdcResponse addDownloadCount(String cstr) {
        DataSet dataSet = dataSetRepository.findTopByCstrOrderByVersionDesc(cstr);
        if (dataSet != null) {
            dataSet.setDownloadCount(dataSet.getDownloadCount() + 1);
            dataSetRepository.save(dataSet);
        }
        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse favoriteStatistics(String cstr) {

        //查看cstr为传入的cstr的 favorite的数量
        if (StringUtils.isBlank(cstr)) {
            return OdcResponseBuilder.buildFailure("cstr参数不能为空");
        }

        Query query = new Query(Criteria.where("cstr").is(cstr));
        long count = mongoTemplate.count(query, TdsFavorite.class, "tds-favorite");

        HashMap<String, Object> result = new HashMap<>();
        result.put("cstr", cstr);
        result.put("favoriteCount", count);

        return OdcResponseBuilder.buildSuccess(result);

    }

    public OdcResponse institutionCountStatistics(String institution) {

        //根据
        Long viewCount = mongoTemplate.aggregate(
                        Aggregation.newAggregation(
                                Aggregation.match(Criteria.where("source").is(institution)),
                                Aggregation.group().sum("viewCount").as("total")
                        ),
                        "tds-dataset",
                        Document.class
                ).getMappedResults().stream()
                .map(doc -> doc.getLong("total"))
                .findFirst()
                .orElse(0L);

        Long downloadCount = mongoTemplate.aggregate(
                        Aggregation.newAggregation(
                                Aggregation.match(Criteria.where("source").is(institution)),
                                Aggregation.group().sum("downloadCount").as("total")
                        ),
                        "tds-dataset",
                        Document.class
                ).getMappedResults().stream()
                .map(doc -> doc.getLong("total"))
                .findFirst()
                .orElse(0L);

        Long favoriteCount = tdsFavoriteRepository.countBySource(institution);

        HashMap<String, Object> result = new HashMap<>();
        result.put("viewCount", viewCount);
        result.put("downloadCount", downloadCount);
        result.put("favoriteCount", favoriteCount);

        return OdcResponseBuilder.buildSuccess(result);
    }

    public OdcResponse institutionComment(String institution, int page, int pageSize) {

        Query query = new Query();
        query.addCriteria(Criteria.where("source").is(institution));

        long total = mongoTemplate.count(query, TdsEvaluation.class, "tds-evaluation");

        PageRequest pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        List<TdsEvaluation> list = mongoTemplate.find(query.with(pageable), TdsEvaluation.class, "tds-evaluation");

        HashMap<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("rows", list);
        return OdcResponseBuilder.buildSuccess(result);
    }

    public OdcResponse getInformationPage(String source, int page, int pageSize) {


        Query query = new Query();

        if (!StringUtils.isBlank(source)) {
            query.addCriteria(Criteria.where("source").is(source));
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "updateAt");

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize, sort);

        HashMap<String, Object> orderMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, TdsInformation.class, "tds-information"));
            put("rows", mongoTemplate.find(query.with(pageable), TdsInformation.class, "tds-information"));
        }};

        return OdcResponseBuilder.buildSuccess(orderMap);


    }

    public OdcResponse getDatasetByCstrList(List<String> cstrList) {
        return OdcResponseBuilder.buildSuccess(dataSetRepository.findByCstrIn(cstrList));
    }

    public OdcResponse getInformationByCstr(String cstr) {
        return OdcResponseBuilder.buildSuccess(tdsInformationRepository.findByCstr(cstr));
    }

    public OdcResponse addAnalysisToolCount(String uid, String title, String toolId, String source) {

//        OidcUser byServiceOpenId = oidcUserRepository.findByServiceOpenId(openId);
        AnalysisToolStatistics analysisToolStatistics = new AnalysisToolStatistics();

        analysisToolStatistics.setCreateAt(new Date());
        analysisToolStatistics.setDatasetTittle(title);
        analysisToolStatistics.setUserId(uid);
        analysisToolStatistics.setToolId(toolId);
        analysisToolStatistics.setToolName(tdsAnalysisToolRepository.findById(toolId).map(TdsAnalysisTool::getToolName).orElse(null));
        analysisToolStatistics.setSource(source);

        analysisToolStatisticsRepository.save(analysisToolStatistics);

        return OdcResponseBuilder.buildSuccess();

    }

    public OdcResponse hasAnalysisToolRecord(String uid, String toolId, String source) {

//        OidcUser byServiceOpenId = oidcUserRepository.findByServiceOpenId(openId);
        if (uid == null) {
            return OdcResponseBuilder.buildFailure("用户不存在");
        }

        boolean exists = analysisToolStatisticsRepository.existsByUserIdAndToolIdAndSource(uid, toolId, source);
        return OdcResponseBuilder.buildSuccess(exists);

    }

    public OdcResponse listAnalysisTool() {
        return OdcResponseBuilder.buildSuccess(tdsAnalysisToolRepository.findAll());
    }

    public OdcResponse addAnalysisTool(TdsAnalysisTool tdsAnalysisTool) {
        tdsAnalysisToolRepository.save(tdsAnalysisTool);
        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse addAnalysisToolEvaluation(TdsAnalysisToolEvaluation tdsAnalysisToolEvaluation) {
        tdsAnalysisToolEvaluation.setCreateAt(Instant.now());
        tdsAnalysisToolEvaluationRepository.save(tdsAnalysisToolEvaluation);
        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse listAnalysisToolEvaluation(String toolId) {
        return OdcResponseBuilder.buildSuccess(tdsAnalysisToolEvaluationRepository.findByToolId(toolId));
    }

    public OdcResponse spaceHubStatistics(String source) {

        if (StringUtils.isBlank(source)) {
            return OdcResponseBuilder.buildFailure("source参数不能为空");
        }

        HashMap<String, Object> result = new HashMap<>();
        result.put("source", source);
        result.put("dataSet", dataSetRepository.countBySource(source));
        result.put("analysisTool", tdsAnalysisToolRepository.count());

        result.put("analysisToolStatistics", analysisToolStatisticsRepository.countBySource(source));

        //如果存在则获取创建时间并将创建时间加到map里
        analysisToolStatisticsRepository.findFirstBySourceOrderByCreateAtDesc(source)
                .ifPresent(statistics -> result.put("createAt", statistics.getCreateAt()));


        return OdcResponseBuilder.buildSuccess(result);
    }

    public OdcResponse getAllDataCenter() {
        List<DataCenter> all = dataCenterRepository.findAllByOrderBySortDesc();

        return OdcResponseBuilder.buildSuccess(all);
    }

    public OdcResponse addDataCenter(DataCenter dataCenter) {
        dataCenterRepository.save(dataCenter);
        return OdcResponseBuilder.buildSuccess();
    }

    @Scheduled(cron = "0 0/10 * * * ?")
    public void tpdcJsonSync() {
        log.info("开始同步国家青藏高原科学数据中心数据");
        try {
            ForestResponse<Map> response = dataCenterJsonClient.getTpdcJson();
            if (!response.isSuccess() || response.getResult() == null) {
                log.warn("获取数据失败: {}", response);
                return;
            }
            Object contentObj = response.getResult().get("content");
            if (contentObj == null) {
                log.warn("返回的 content 为空");
                return;
            }

            // ★ 关键：将 contentObj 转换为 List（假设接口返回的是 JSON 数组）
            List<Map<String, Object>> jsonList;
            if (contentObj instanceof List) {
                jsonList = (List<Map<String, Object>>) contentObj;
            } else {
                // 如果不是 List，可尝试包装为单元素列表或记录异常
                log.error("content 不是数组类型，实际类型：{}", contentObj.getClass().getName());
                return;
            }

            // 查询或创建实体
            Optional<DataCenterJson> optional = dataCenterJsonRepository.findByName("国家青藏高原科学数据中心");
            DataCenterJson entity = optional.orElseGet(DataCenterJson::new);
            entity.setJson(jsonList);          // ★ 直接保存 List
            entity.setName("国家青藏高原科学数据中心");
            entity.setSyncTime(new Date());
            dataCenterJsonRepository.save(entity);

            log.info("同步成功，数据条数: {}", jsonList.size());
        } catch (Exception e) {
            log.error("同步异常", e);
            // 可发送告警
        }
    }

    //定时推送数据咨询消息

    public OdcResponse getDataCenterJson(String dataCenterName) {

        Optional<DataCenterJson> optional = dataCenterJsonRepository.findByName(dataCenterName);
        if (optional.isPresent()) {
            return OdcResponseBuilder.buildSuccess(optional.get());
        } else {
            return OdcResponseBuilder.buildFailure("数据不存在");
        }
    }

    public OdcResponse applyDataSet(DataSetApply dataSetApply) {

        OidcUser byUid = oidcUserRepository.findByUid(dataSetApply.getUid());
        if (byUid == null) {
            return OdcResponseBuilder.buildFailure("用户不存在");
        }

        Optional<DataSet> optionalDataSet = dataSetRepository.findById(dataSetApply.getDataSetId());
        if (optionalDataSet.isEmpty()) {
            return OdcResponseBuilder.buildFailure("数据不存在");
        }
        DataSet dataSet = optionalDataSet.get();

        dataSetApply.setUsername(byUid.getUsername());
        dataSetApply.setPhone(byUid.getPhone());
        dataSetApply.setDataSetUserOpenId(byUid.getServiceOpenId());


        dataSetApply.setDataSetId(dataSet.getId());
        dataSetApply.setDataSetTitle(dataSet.getTitleZh());
        dataSetApply.setDataSetSize(dataSet.getByteSize());
        dataSetApply.setDataSetFileNumber(dataSet.getFileNumber());
        dataSetApply.setDataSetSource(dataSet.getSource());

        dataSetApply.setStatus("0");
        dataSetApply.setIsView("0");


        DataCenter dataCenter = dataCenterRepository.findFirstBySource(dataSet.getSource());
        if (dataCenter == null || dataCenter.getAdminOpenId() == null) {
            throw new OdcException("数据源管理员不存在");
        }

        OidcUser adminUser = oidcUserRepository.findByUid(dataCenter.getAdminUid());
        if (adminUser == null) {
            throw new OdcException("数据源管理员不存在");
        }


        dataSetApply.setDataSetSourceOpenId(dataCenter.getAdminOpenId());
        dataSetApply.setDataSetSourceUid(dataCenter.getAdminUid());
        dataSetApply.setDataSetSourceUsername(adminUser.getUsername());


        dataSetApply.setApplyTime(new Date());

        String sendTitle = dataSetApply.getDataSetTitle();


        if (sendTitle != null && sendTitle.length() > 20) {
            sendTitle = sendTitle.substring(0, 17) + "...";
        }

        dataSetApplyRepository.save(dataSetApply);

        //https://fairspace.cn/m/apply-audit?applyId=6ab233db2c2d2b83826e4f62&uid=user_agp3mhua3byagtt72ostzna3fs
        String url = "https://fairspace.cn/m/apply-audit?applyId=" + dataSetApply.getId() + "&uid=" + dataSetApply.getDataSetSourceUid();

        //发送消息
        sendDatasetApplyMsg(byUid.getUsername(), sendTitle, dataCenter.getAdminOpenId(), url);

        return OdcResponseBuilder.buildSuccess();


    }

    public OdcResponse spaceHubStatisticsByDate(String source, Date startTime, Date endTime) {

        if (StringUtils.isBlank(source)) {
            return OdcResponseBuilder.buildFailure("source参数不能为空");
        }

        if (startTime == null || endTime == null) {
            return OdcResponseBuilder.buildFailure("startTime或endTime参数不能为空");
        }

        // 把 createAt 转成 "yyyy-MM-dd" 字符串（Asia/Shanghai 时区）用于分组
        AggregationOperation dateToString = context -> new Document("$project",
                new Document("date", new Document("$dateToString",
                        new Document("format", "%Y-%m-%d")
                                .append("date", "$createAt")
                                .append("timezone", "Asia/Shanghai"))));

        Aggregation agg = Aggregation.newAggregation(
                match(Criteria.where("source").is(source)
                        .and("createAt").gte(startTime).lte(endTime)),
                dateToString,
                group("date").count().as("count"),
                sort(Sort.by(Sort.Direction.ASC, "_id"))
        );

        AggregationResults<Document> result =
                mongoTemplate.aggregate(agg, "analysis-tool-statistics", Document.class);

        // 转换结果，_id 改为 date 字段
        List<Map<String, Object>> callCountByDay = new ArrayList<>();
        for (Document doc : result.getMappedResults()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", doc.get("_id"));
            item.put("count", doc.get("count"));
            callCountByDay.add(item);
        }

        HashMap<String, Object> resultMap = new HashMap<>();
        resultMap.put("source", source);
        resultMap.put("callCountByDay", callCountByDay);

        //统计在时间范围内，每个工具的调用比例
        Aggregation aggByTool = Aggregation.newAggregation(
                match(Criteria.where("source").is(source)
                        .and("createAt").gte(startTime).lte(endTime)),
                group("toolId").count().as("count"),
                sort(Sort.by(Sort.Direction.DESC, "count"))  // 可选按调用次数降序
        );
        AggregationResults<Document> resultByTool =
                mongoTemplate.aggregate(aggByTool, "analysis-tool-statistics", Document.class);

// 转换 tool 统计结果
        List<Map<String, Object>> callCountByTool = new ArrayList<>();
        for (Document doc : resultByTool.getMappedResults()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("toolId", doc.get("_id"));
            item.put("count", doc.get("count"));  // 这里可能是 Integer
            callCountByTool.add(item);
        }

// 安全地计算总调用次数（兼容 Integer / Long / Double 等）
        long totalCalls = callCountByTool.stream()
                .mapToLong(m -> ((Number) m.get("count")).longValue())
                .sum();

// 计算占比
        List<Map<String, Object>> callRateByTool = new ArrayList<>();
        for (Map<String, Object> item : callCountByTool) {
            Map<String, Object> rateItem = new LinkedHashMap<>();
            rateItem.put("toolId", item.get("toolId"));
            Number count = (Number) item.get("count");
            rateItem.put("count", count);
            rateItem.put("rate", count.longValue() * 1.0 / totalCalls);
            callRateByTool.add(rateItem);
        }

// 放入 resultMap
        resultMap.put("callCountByTool", callCountByTool);
        resultMap.put("callRateByTool", callRateByTool);


        // 统计在时间范围内，每个数据集（datasetTittle）的调用次数（按次数降序）
        Aggregation aggByDataSet = Aggregation.newAggregation(
                match(Criteria.where("source").is(source)
                        .and("createAt").gte(startTime).lte(endTime)),
                group("datasetTittle").count().as("count"),
                sort(Sort.by(Sort.Direction.DESC, "count"))  // 按调用次数降序排名
        );
        AggregationResults<Document> resultByDataSet =
                mongoTemplate.aggregate(aggByDataSet, "analysis-tool-statistics", Document.class);

// 转换结果
        List<Map<String, Object>> callCountByDataSet = new ArrayList<>();
        for (Document doc : resultByDataSet.getMappedResults()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("datasetTittle", doc.get("_id"));   // group 的 _id 就是 datasetTittle
            item.put("count", doc.get("count"));          // 注意：MongoDB 返回的 count 可能是 Integer，但存入 Map 后无需转换
            callCountByDataSet.add(item);
        }

// 放入 resultMap
        resultMap.put("callCountByDataSet", callCountByDataSet);


        return OdcResponseBuilder.buildSuccess(resultMap);
    }

    public OdcResponse listAnalysisToolRecord(String source, Date startTime, Date endTime, int page, int pageSize) {

        if (StringUtils.isBlank(source)) {
            return OdcResponseBuilder.buildFailure("source参数不能为空");
        }
        if (startTime == null || endTime == null) {
            return OdcResponseBuilder.buildFailure("startTime或endTime参数不能为空");
        }

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        Page<AnalysisToolStatistics> result = analysisToolStatisticsRepository
                .findBySourceAndCreateAtBetweenOrderByCreateAtDesc(source, startTime, endTime, pageable);

        HashMap<String, Object> resultMap = new HashMap<>();
        resultMap.put("source", source);
        resultMap.put("content", result.getContent());
        resultMap.put("pageSize", result.getSize());
        resultMap.put("totalElements", result.getTotalElements());
        resultMap.put("totalPages", result.getTotalPages());

        return OdcResponseBuilder.buildSuccess(resultMap);
    }

    public void sendDatasetApplyMsg(String name, String title, String openId,String url) {
        String templateId = "vbXaAlwSE-kf59t6LQpFBhAAO3sqBpCyFIQ-yXnaopk";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> thing5 = new HashMap<>();
        thing5.put("value", title);
        data.put("thing5", thing5);

        Map<String, String> thing4 = new HashMap<>();
        thing4.put("value", name);
        data.put("thing4", thing4);


        Map<String, String> time3 = new HashMap<>();

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai")); // 指定北京时间
        String timeValue = sdf.format(new Date());
        time3.put("value", timeValue);
        data.put("time3", time3);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);
        requestBody.put("url", url);
        requestBody.put("data", data);

        System.out.println("data: " + data);
        System.out.println("requestBody: " + requestBody);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public void sendDatasetApprovalMsg(String name, String title, String result, String timeValue, String openId,String url) {
        String templateId = "dYb39DvUfq0rmtZ_UfPrcvhvNLe82lRQOhQjUHHT3jM";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> thing7 = new HashMap<>();
        thing7.put("value", title);
        data.put("thing7", thing7);

        Map<String, String> const4 = new HashMap<>();
        const4.put("value", result);
        data.put("const4", const4);

        Map<String, String> thing11 = new HashMap<>();
        thing11.put("value", name);
        data.put("thing11", thing11);

        Map<String, String> time9 = new HashMap<>();

//        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai")); // 指定北京时间
//        String timeValue = sdf.format(new Date());
        time9.put("value", timeValue);
        data.put("time9", time9);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);


        requestBody.put("url", url);
        requestBody.put("data", data);

        System.out.println("data: " + data);
        System.out.println("requestBody: " + requestBody);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public OdcResponse listDatasetApplyByUser(String uid, int page, int pageSize) {

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        Page<DataSetApply> result = dataSetApplyRepository.findByUid(uid, pageable);
        HashMap<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", result.getContent());
        resultMap.put("pageSize", result.getSize());
        resultMap.put("totalElements", result.getTotalElements());
        resultMap.put("totalPages", result.getTotalPages());


        return OdcResponseBuilder.buildSuccess(resultMap);
    }


    public OdcResponse listDatasetApprovalByUser(String uid, int page, int pageSize) {

        Pageable pageable = PageRequest.of(page >= 1 ? page - 1 : page, pageSize);
        Page<DataSetApply> result = dataSetApplyRepository.findByDataSetSourceUid(uid, pageable);
        HashMap<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", result.getContent());
        resultMap.put("pageSize", result.getSize());
        resultMap.put("totalElements", result.getTotalElements());
        resultMap.put("totalPages", result.getTotalPages());


        return OdcResponseBuilder.buildSuccess(resultMap);

    }

    public OdcResponse DatasetApplyApproval(String applyId, String uid, String reason, String status) {

        if (dataSetApplyRepository.findById(applyId).isPresent()) {


            DataSetApply apply = dataSetApplyRepository.findById(applyId).get();

            if (!apply.getUid().equals(uid)) {
                return OdcResponseBuilder.buildFailure("无权限操作");
            }
            if (!apply.getStatus().equals("0")) {
                return OdcResponseBuilder.buildFailure("申请状态异常");
            }

            if (!status.equals("1") && !status.equals("2")){
                return OdcResponseBuilder.buildFailure("状态参数异常");
            }
            apply.setStatus(status);
            apply.setReason(reason);
            dataSetApplyRepository.save(apply);

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai")); // 指定北京时间
            String timeValue = sdf.format(new Date());


            String sendTitle = apply.getDataSetTitle();


            if (sendTitle != null && sendTitle.length() > 20) {
                sendTitle = sendTitle.substring(0, 17) + "...";
            }


            String result = "通过";

            String downloadUrl = "";

            if (status.equals("1")){

                String token = generateDownloadToken(apply.getUid(), apply.getDataSetId());

                downloadUrl = "https://fairspace.cn/tds-trading/order/dataset.downloadByToken?token=" + token;
            }
            if (status.equals("2")) {
                 result = "未通过";
            }

            String url = "https://fairspace.cn/m/apply-approval?applyId=" + applyId + "&uid=" + apply.getUid() + "&downloadUrl=" + downloadUrl;

            //发送微信消息
            sendDatasetApprovalMsg(apply.getDataSetSourceUsername(), sendTitle, result, timeValue, apply.getDataSetUserOpenId(), url);


        } else {
            return OdcResponseBuilder.buildFailure("申请不存在");
        }

        return OdcResponseBuilder.buildSuccess();
    }

    @Scheduled(cron = "0 0 8 * * ?")
    public void sendInformationMsgTask() {
        TdsInformation tdsInformation = tdsInformationRepository.findFirstByIsSendOrderByUpdateAtAsc("0");
        if (tdsInformation != null) {


            List<String> openIds = oidcUserRepository.findAll().stream().map(OidcUser::getServiceOpenId).toList();


            tdsInformation.setIsSend("1");
            tdsInformationRepository.save(tdsInformation);


            String title = tdsInformation.getName();


            if (title != null && title.length() > 20) {
                title = title.substring(0, 17) + "...";
            }

            String finalSendTitle = title;

            openIds.forEach(openId -> sendInformationMsg(finalSendTitle, openId, tdsInformation.getUrl()));



        }


    }

    public void sendInformationMsg(String title, String openId, String url) {

        String templateId = "XBk7a2sJ8hk-CnlXOH8BrGM7Uunnu2bbjQv8YploT9Q";
        String accessToken = getAccessToken();

        if (accessToken == null || accessToken.isEmpty()) {
            System.err.println("获取access_token失败");
            return;
        }

        // 构建data部分
        Map<String, Object> data = new HashMap<>();

        Map<String, String> thing6 = new HashMap<>();
        thing6.put("value", "最新数据资讯提醒");
        data.put("thing6", thing6);

        Map<String, String> thing13 = new HashMap<>();
        thing13.put("value", title);
        data.put("thing13", thing13);

        // 构建完整请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("touser", openId);
        requestBody.put("template_id", templateId);


        requestBody.put("url", url);
        requestBody.put("data", data);

        System.out.println("data: " + data);
        System.out.println("requestBody: " + requestBody);

        // 发送请求
        ForestResponse<String> response = weChatApiClient.sendTemplateMessage(accessToken, requestBody);
        System.out.println("发送结果：" + response.getResult());
    }

    public OdcResponse canDownloadDataset(String uid, String datasetId) {
        if (StringUtils.isBlank(uid) || StringUtils.isBlank(datasetId)) {
            return OdcResponseBuilder.buildFailure("参数错误");
        }

        // 查询是否存在 uid 与 dataSetId 同时匹配，且 endTime 晚于当前时间的申请记录
        Optional<DataSetApply> validApply = dataSetApplyRepository.findValidApply(uid, datasetId, new Date());

        boolean canDownload = validApply.isPresent();
        log.info("canDownloadDataset uid={}, datasetId={}, canDownload={}", uid, datasetId, canDownload);

        Map<String, Object> result = new HashMap<>();
        result.put("canDownload", canDownload);
        if (canDownload) {
            DataSetApply apply = validApply.get();
            result.put("applyId", apply.getId());
            result.put("endTime", apply.getEndTime());
        }
        return OdcResponseBuilder.buildSuccess(result);
    }

    /**
     * 生成数据集下载 token
     * 将 uid、datasetOid、当前时间 + UUID 拼接后 SHA-256 加密，生成唯一 token
     * 保存到 tds-download-token 集合，useCount 初始为 0
     *
     * @param uid        用户 uid
     * @param datasetOid 数据集 oid
     * @return 生成的 token 字符串
     */
    public String generateDownloadToken(String uid, String datasetOid) {
        if (StringUtils.isBlank(uid) || StringUtils.isBlank(datasetOid)) {
            OdcUtils.exception().message("参数错误");
        }

        Date now = new Date();

        // 加密：uid + datasetOid + timestamp + UUID（防止同一毫秒内重复）→ SHA-256
        String raw = uid + "|" + datasetOid + "|" + now.getTime() + "|" + UUID.randomUUID();
        String token = sha256Hex(raw);

        DownloadToken entity = new DownloadToken();
        entity.setUid(uid);
        entity.setDatasetOid(datasetOid);
        entity.setCreateTime(now);
        entity.setToken(token);
        entity.setUseCount(0);
        downloadTokenRepository.save(entity);

        log.info("generateDownloadToken uid={}, datasetOid={}, token={}", uid, datasetOid, token);
        return token;
    }

    /** SHA-256 十六进制输出 */
    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 加密失败", e);
        }
    }

    public String getDownloadDatasetUrl(String datasetOid) {

        //根据datasetOid查询DataSet，注意datasetOid为DataSet的id字段
        //临时写死，逻辑后续补充
        return "https://fairspace.cn/s3/tpdc-bucket/DS_8e0634a0335d4ba28a0a6b74ceea55ad/CoLChina2024/%E5%8A%A8%E7%89%A9%E7%95%8C-%E5%85%B6%E4%BB%96%E6%97%A0%E8%84%8A%E6%A4%8E%E5%8A%A8%E7%89%A9-2024-17712.xlsx";
    }

    /**
     * 根据 token 下载数据集文件（流式传输给前端）
     *
     * 校验规则：
     *   1. token 不存在 → 返回 404
     *   2. useCount > 0  → 返回"下载链接已使用"
     *   3. createTime 距今超过 24 小时 → 返回"token 已过期"
     *   4. 校验通过 → useCount++，调用 getDownloadDatasetUrl 获取真实下载地址，流式返回
     *
     * @param token 一次性下载 token
     * @return 流式文件响应
     */
    public ResponseEntity<Resource> downloadByToken(String token) throws IOException {
        if (StringUtils.isBlank(token)) {
            OdcUtils.exception().message("token 不能为空");
        }

        Optional<DownloadToken> opt = downloadTokenRepository.findByToken(token);
        if (opt.isEmpty()) {
            OdcUtils.exception().message("token 不存在");
        }

        DownloadToken dt = opt.get();

        // 规则 1：已使用
        if (dt.getUseCount() > 0) {
            log.warn("token 已被使用 token={}", token);
            OdcUtils.exception().message("下载链接已使用");
        }

        // 规则 2：过期（超过 24 小时）
        long expireAt = dt.getCreateTime().getTime() + 24L * 60 * 60 * 1000;
        if (System.currentTimeMillis() > expireAt) {
            log.warn("token 已过期 token={}, createTime={}", token, dt.getCreateTime());
            OdcUtils.exception().message("token 已过期");
        }

        // 标记已使用
        dt.setUseCount(1);
        downloadTokenRepository.save(dt);

        // 获取远程下载地址（临时写死）
        String remoteUrl = getDownloadDatasetUrl(dt.getDatasetOid());
        log.info("downloadByToken token={}, datasetOid={}, remoteUrl={}", token, dt.getDatasetOid(), remoteUrl);

        // 流式传输：Spring 会从远程 URL 读取并直接写入 HttpServletResponse
        Resource resource = new UrlResource(remoteUrl);
        if (!resource.exists()) {
            OdcUtils.exception().message("无效的下载地址");
        }

        // 尝试从 URL 最后一段提取文件名
        String filename = remoteUrl.contains("?") ? remoteUrl.substring(0, remoteUrl.indexOf("?")) : remoteUrl;
        filename = filename.substring(filename.lastIndexOf('/') + 1);
        // URL 解码（还原中文）
        String decodedFilename = java.net.URLDecoder.decode(filename, java.nio.charset.StandardCharsets.UTF_8);

        // Content-Disposition RFC 5987 编码：HTTP Header 只能放 ISO-8859-1 字符
        // filename="xxx" → ASCII 兜底（旧浏览器）
        // filename*=UTF-8''%XX%XX → RFC 5987（现代浏览器支持中文名）
        String asciiFallback = decodedFilename.replaceAll("[^\\x20-\\x7E]", "_");
        String rfc5987Encoded = java.net.URLEncoder.encode(decodedFilename, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");
        String contentDisposition = "attachment; filename=\"" + asciiFallback + "\"; filename*=UTF-8''" + rfc5987Encoded;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentLength(resource.contentLength())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }




}

