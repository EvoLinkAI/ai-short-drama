/**
 * 🔧 环境配置工具
 * 集中管理环境变量的获取，避免到处重复
 */

export function getPublicBaseUrl(): string {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

/**
 * 获取应用内部 baseUrl。
 * 用于容器内自调用、服务端 fetch 本应用 API、拉取本地 /api/files 资源等场景。
 */
export function getInternalBaseUrl(): string {
    return process.env.INTERNAL_APP_URL
        || process.env.INTERNAL_TASK_API_BASE_URL
        || process.env.NEXTAUTH_URL
        || 'http://localhost:3000'
}

/**
 * 向后兼容：当前仓库中 getBaseUrl 主要用于服务端内部调用，因此默认返回内部地址。
 */
export function getBaseUrl(): string {
    return getInternalBaseUrl()
}

/**
 * 获取完整的 API URL
 * @param path API 路径，如 '/api/user/balance'
 */
export function getApiUrl(path: string): string {
    const baseUrl = getInternalBaseUrl()
    // 确保 path 以 / 开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${normalizedPath}`
}
