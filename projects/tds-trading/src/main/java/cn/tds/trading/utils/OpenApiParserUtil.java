package cn.tds.trading.utils;

import cn.tds.common.core.ApiInfo;
import io.swagger.parser.OpenAPIParser;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenApiParserUtil Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/12/1 14:10
 */
public class OpenApiParserUtil {

    public static List<ApiInfo> parser(String apiDocUrl) {
        List<ApiInfo> result = new ArrayList<>();

        SwaggerParseResult swaggerParseResult = new OpenAPIParser()
                .readLocation(apiDocUrl, null, null);
        OpenAPI openAPI = swaggerParseResult.getOpenAPI();
        Components components = openAPI.getComponents();
        String url = openAPI.getServers().get(0).getUrl();

        for (Map.Entry<String, PathItem> entry : openAPI.getPaths().entrySet()) {
            String path = entry.getKey();
            PathItem pathItem = entry.getValue();
            Operation api = getOperation(pathItem);
            PathItem.HttpMethod method = getMethod(pathItem);
            String tag = api.getTags() == null || api.getTags().isEmpty() ? "" : api.getTags().get(0);
            String operationId = api.getOperationId();
            String description = StringUtils.defaultIfBlank(api.getDescription(), api.getSummary());
            List<Map<String, String>> allParams = getAllParameter(components, api);

            result.add(new ApiInfo(url, method.toString(), path, tag, operationId, description, allParams));
        }
        return result;
    }

    public static Operation getOperation(PathItem pathItem) {
        if (pathItem.getGet() != null) {
            return pathItem.getGet();
        }
        if (pathItem.getPost() != null) {
            return pathItem.getPost();
        }
        if (pathItem.getPut() != null) {
            return pathItem.getPut();
        }
        if (pathItem.getDelete() != null) {
            return pathItem.getDelete();
        }
        if (pathItem.getPatch() != null) {
            return pathItem.getPatch();
        }
        throw new RuntimeException("不支持的请求类型");
    }

    /**
     * 获取请求方法类型
     */
    public static PathItem.HttpMethod getMethod(PathItem pathItem) {
        if (pathItem.getGet() != null) {
            return PathItem.HttpMethod.GET;
        }
        if (pathItem.getPost() != null) {
            return PathItem.HttpMethod.POST;
        }
        if (pathItem.getPut() != null) {
            return PathItem.HttpMethod.PUT;
        }
        if (pathItem.getDelete() != null) {
            return PathItem.HttpMethod.DELETE;
        }
        if (pathItem.getPatch() != null) {
            return PathItem.HttpMethod.PATCH;
        }
        throw new RuntimeException("不支持的请求类型");
    }

    /**
     * 解析api中的所有参数名
     */
    private static List<Map<String, String>> getAllParameter(Components components, Operation api) {
        List<Map<String, String>> parameterList = new ArrayList<>();
        List<Parameter> parameters = api.getParameters();
        if (!CollectionUtils.isEmpty(parameters)) {
            for (Parameter parameter : parameters) {
                parameterList.add(Map.of(
                        "name", parameter.getName(),
                        "in", parameter.getIn(),
                        "required", parameter.getRequired().toString(),
                        "schema", parameter.getSchema().getTypes().stream().findFirst().get().toString()));
            }
        }

        List<String> bodyParameterList = new ArrayList<>();
        RequestBody requestBody = api.getRequestBody();
        if (requestBody == null || requestBody.getContent() == null) {
            return parameterList;
        }

        Content content = requestBody.getContent();
        for (Map.Entry<String, MediaType> entry : content.entrySet()) {
            MediaType mediaType = entry.getValue();
            if (mediaType == null || mediaType.getSchema() == null) {
                continue;
            }
            Schema<?> schema = mediaType.getSchema();
            Map<String, Schema> properties = new HashMap<>();
            if (schema.getProperties() != null) {
                properties = schema.getProperties();
            } else {
                String ref = schema.get$ref();
                if (StringUtils.isNotEmpty(ref) && components.getSchemas() != null) {
                    String[] split = ref.split("/");
                    String schemaKey = split[split.length - 1];
                    Schema<?> refSchema = components.getSchemas().get(schemaKey);
                    if (refSchema != null) {
                        properties = refSchema.getProperties();
                    }
                }
            }
            if (properties != null) {
                bodyParameterList.addAll(properties.keySet());
            }
        }

        List<Map<String, String>> parameterAll = new ArrayList<>(parameterList);
        return parameterAll;
    }
}