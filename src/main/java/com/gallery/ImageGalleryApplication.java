package com.gallery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@SpringBootApplication
@RestController
public class ImageGalleryApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImageGalleryApplication.class, args);
    }

    @GetMapping("/list-images")
    @CrossOrigin
    public List<String> listImages() throws IOException {
        Path imagesPath = Paths.get("images");
        return Files.list(imagesPath)
                .filter(path -> isImageFile(path.toString()))
                .map(path -> path.getFileName().toString())
                .collect(Collectors.toList());
    }

    private boolean isImageFile(String fileName) {
        fileName = fileName.toLowerCase();
        return fileName.endsWith(".jpg") || 
               fileName.endsWith(".jpeg") || 
               fileName.endsWith(".png") || 
               fileName.endsWith(".gif") || 
               fileName.endsWith(".bmp");
    }
} 