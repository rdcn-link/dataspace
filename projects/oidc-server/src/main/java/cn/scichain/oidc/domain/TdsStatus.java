package cn.scichain.oidc.domain;

import cn.scichain.oidc.exception.OidcException;

/**
 * TdsStatus 数据空间状态枚举
 *
 * @author 郭志斌
 * @version tds-console 1.0.0
 * <b> Creation Time:</b> 2025/11/4 14:26
 */
public enum TdsStatus {

    /**
     * 暂存
     */
    SUBMIT(1),

    /**
     * 待处理
     */
    WAIT(0),

    /**
     * 正常/审批/审核通过
     */
    APPROVE(9),

    /**
     * 驳回
     */
    REJECT(2),

    /**
     * 删除
     */
    DELETE(-1),

    /**
     * 禁用
     */
    DISABLE(3);

    /**
     * 状态编码
     */
    private int code;

    TdsStatus(int code){
        this.code = code;
    }

    /**
     * 获取状态编码
     *
     * @return 状态编码
     */
    public int getCode() {
        return code;
    }

    /**
     * 根据状态编码获取状态枚举
     *
     * @param code 状态编码
     * @return 状态枚举
     */
    public static TdsStatus getByCode(int code) {
        for (TdsStatus value : values()) {
            if (value.code == code) {
                return value;
            }
        }
        throw new OidcException("无效的响应代码.");
    }
}
