package cn.scichain.oidc.util;

import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * UUID5 Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/15 10:11
 */
public final class UUID5 {

    /**
     * 版本号
     */
    private static final int VERSION = 5;

    private UUID5() {

    }

    /**
     * 生成 UUID
     *
     * @param source 原始数据
     * @return UUID
     */
    public static UUID fromString(String source) {
        return fromBytes(source.getBytes(StandardCharsets.UTF_8));
    }

    private static UUID fromBytes(byte[] source) {
        if (source == null) {
            throw new NullPointerException("name == null");
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            return makeUUID(md.digest(source), VERSION);
        } catch (NoSuchAlgorithmException e) {
            throw new AssertionError(e);
        }
    }

    private static UUID makeUUID(byte[] hash, int version) {
        long msb = peekLong(hash, 0, ByteOrder.BIG_ENDIAN);
        long lsb = peekLong(hash, 8, ByteOrder.BIG_ENDIAN);
        // Set the version field
        msb &= ~(0xfL << 12);
        msb |= ((long)version) << 12;
        // Set the variant field to 2
        lsb &= ~(0x3L << 62);
        lsb |= 2L << 62;
        return new UUID(msb, lsb);
    }

    private static long peekLong(final byte[] src, final int offset, final ByteOrder order) {
        long ans = 0;
        if (order == ByteOrder.BIG_ENDIAN) {
            for (int i = offset; i < offset + 8; i += 1) {
                ans <<= 8;
                ans |= src[i] & 0xffL;
            }
        } else {
            for (int i = offset + 7; i >= offset; i -= 1) {
                ans <<= 8;
                ans |= src[i] & 0xffL;
            }
        }
        return ans;
    }
}
