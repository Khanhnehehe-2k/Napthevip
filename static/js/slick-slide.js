$(document).ready(function () {
    $('.slick-slider').slick({
        prevArrow: '<a class="_1hweB5ItSQQHG-8EWc4tSA">❮</a>',
        nextArrow: '<a class="_1hweB5ItSQQHG-8EWc4tSA _3PirFWhopJOXGnZhpuqX1r">❯</a>',
        autoplay: true,
        autoplaySpeed: 3000,
        infinite: true,
        variableWidth: true,
        arrows: true
    });
    
    var $slick = $('.slick-slider');
    var $slickSlides = $('.slick-slide');

    function setSlideWidth() {
        var slideWidth = $(window).width(); // Thay 3 bằng số lượng slide hiển thị trên một hàng
        const calSlideWidth = slideWidth >= 576 ? slideWidth - 60 : slideWidth;
      
        $slick.css("maxWidth", calSlideWidth);
        $slickSlides.width(calSlideWidth);
    }

    // Set chiều rộng cho slide ban đầu
    setSlideWidth();

    // Set lại chiều rộng khi cửa sổ trình duyệt thay đổi kích thước
    $(window).resize(function () {
        setSlideWidth();
    });
});