package cn.tds.trading.http;

import com.dtflys.forest.annotation.Get;
import com.dtflys.forest.annotation.Query;
import com.dtflys.forest.http.ForestResponse;

import java.util.Map;

/**
 * DataCenterJsonClient Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/8/27 15:32
 */
public interface DataCenterJsonClient {


    @Get(url = "https://databox.tpdc.ac.cn/api/v1/tpdc/config/file")
    ForestResponse<Map> getTpdcJson(
    );

}
