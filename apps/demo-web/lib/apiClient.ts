// src/lib/apiClient.ts
import axios from 'axios';

// 1. 전역 Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// 2. 요청 인터셉터 (Request Interceptor)
// apps/demo-web/src/lib/apiClient.ts 의 요청 인터셉터 부분
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId') || '101'; 
      
      // 💡 수정된 부분: 배열 대괄호 방식 대신 .set() 메서드 사용
      config.headers.set('x-user-id', userId);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 💡 401(Unauthorized) 또는 403(Forbidden) 에러 처리 로직
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined') {
        console.warn('인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;