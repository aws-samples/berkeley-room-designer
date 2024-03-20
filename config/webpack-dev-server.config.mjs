import * as path from 'path';

const distDir = 'dist.frontend';

export default {
  entry: `./${distDir}/frontend/webpack.js`,
  output: {
    filename: 'webpack.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(woff|woff2) (\?v=\d+\.\d+\.\d+)?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff'
      }
    ]
  },
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    historyApiFallback: true,
    allowedHosts: 'all',
    static: {
      directory: path.join(process.cwd(), distDir),
      watch: {
        usePolling: false
      }
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        secure: false
      }
    }
  }
}