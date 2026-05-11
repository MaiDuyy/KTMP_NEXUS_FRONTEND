import { useEffect, useRef } from 'react';

const useRingtone = (audioUrl : string, loop: boolean = true) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Khởi tạo Audio object
        audioRef.current = new Audio(audioUrl);
        // Tùy chỉnh loop (mặc định là true cho nhạc chuông)
        audioRef.current.loop = loop; 

        // Cleanup: Dừng âm thanh khi component unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, [audioUrl]);

    const playRingtone = () => {
        if (audioRef.current) {
            // play() trả về một Promise. Cần bắt lỗi vì trình duyệt có thể chặn autoplay
            audioRef.current.play().catch(error => {
                console.warn("Trình duyệt chặn Autoplay âm thanh:", error);
            });
        }
    };

    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Trả âm thanh về giây đầu tiên
        }
    };

    return { playRingtone, stopRingtone };
};

export default useRingtone;