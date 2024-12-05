// 获取DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const compressionRate = document.getElementById('compressionRate');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片数据
let currentFile = null;
let compressTimeout = null;

// 防抖函数
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(compressTimeout);
            func(...args);
        };
        clearTimeout(compressTimeout);
        compressTimeout = setTimeout(later, wait);
    };
}

// 初始化事件监听
function initializeEvents() {
    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 文件拖放处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#1a73e8';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 质量滑块变化处理（添加防抖）
    qualitySlider.addEventListener('input', (e) => {
        // 将0-100的范围映射到20-100
        const displayQuality = Math.round(((e.target.value / 100) * 80) + 20);
        qualityValue.textContent = `${displayQuality}%`;
    });

    // 滑块释放后才进行压缩（性能优化）
    qualitySlider.addEventListener('change', debounce((e) => {
        if (currentFile) {
            // 将0-100的范围映射到20-100的实际压缩质量
            const actualQuality = ((e.target.value / 100) * 0.8) + 0.2;
            compressImage(currentFile, actualQuality);
        }
    }, 300));

    // 下载按钮处理
    downloadBtn.addEventListener('click', downloadCompressedImage);
}

// 处理选择的文件
function handleFile(file) {
    // 检查文件类型
    if (!file.type.match('image.*')) {
        alert('请选择图片文件！');
        return;
    }

    currentFile = file;
    previewContainer.style.opacity = '0.6';

    // 显示原图预览
    originalPreview.src = URL.createObjectURL(file);
    originalSize.textContent = formatFileSize(file.size);
    previewContainer.style.display = 'block';

    // 获取当前滑块值并转换为实际压缩质量
    const sliderValue = qualitySlider.value;
    const actualQuality = ((sliderValue / 100) * 0.8) + 0.2;
    compressImage(file, actualQuality);
}

// 压缩图片
function compressImage(file, quality) {
    const img = new Image();
    
    img.onload = () => {
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算压缩后的尺寸
        let { width, height } = calculateDimensions(img.width, img.height, quality);
        
        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 根据文件类型选择压缩方式
        const outputType = file.type === 'image/png' ? 'image/jpeg' : 'image/jpeg';
        
        // 对PNG特殊处理：强制转换为JPEG以获得更好的压缩效果
        canvas.toBlob(
            (blob) => {
                if (!blob) return;

                // 更新预览和信息
                compressedPreview.src = URL.createObjectURL(blob);
                compressedSize.textContent = formatFileSize(blob.size);
                
                // 计算压缩率
                const rate = ((1 - blob.size / file.size) * 100).toFixed(1);
                compressionRate.textContent = `${rate}%`;
                
                // 恢复显示状态
                previewContainer.style.opacity = '1';
            },
            outputType,
            quality
        );
    };

    img.src = URL.createObjectURL(file);
}

// 计算压缩后的尺寸
function calculateDimensions(originalWidth, originalHeight, quality) {
    // 根据质量等级计算缩放比例
    const scale = quality < 0.3 ? 0.5 : quality < 0.5 ? 0.6 : quality < 0.7 ? 0.7 : 0.8;
    
    // 计算新尺寸
    const width = Math.floor(originalWidth * scale);
    const height = Math.floor(originalHeight * scale);
    
    return { width, height };
}

// 下载压缩后的图片
function downloadCompressedImage() {
    if (!currentFile) return;
    
    const link = document.createElement('a');
    link.download = `compressed_${currentFile.name.replace(/\.png$/, '.jpg')}`;
    link.href = compressedPreview.src;
    link.click();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化应用
initializeEvents(); 