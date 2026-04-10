import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: { title: 'Carpoolink API', description: 'swagger-autogen으로 자동 생성된 API 문서' },
    host: 'localhost:3000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/routes/index.js']; // 라우터가 시작되는 지점

swaggerAutogen()(outputFile, endpointsFiles, doc);