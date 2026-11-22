package cn.scichain.oidc.domain;

import lombok.Data;

/**
 * TdsAudit 数据空间审核
 *
 * @author 郭志斌
 * @version tds-console 1.0.0
 * <b> Creation Time:</b> 2025/11/4 15:10
 */
@Data
public class TdsAudit {

    /**
     * 对应 MongoDB ObjectID / 唯一标识
     */
    private String id;

    /**
     * 审核状态
     */
    private int status;

    /**
     * 拒绝原因
     */
    private String reason;
}
